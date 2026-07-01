from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.utils import timezone
from datetime import timedelta
from scheduler.models import Event


class Command(BaseCommand):
    help = 'Sends email reminders for upcoming events that have notify=True'

    def handle(self, *args, **options):
        now = timezone.now()
        pending_events = Event.objects.filter(notify=True, notification_sent=False)

        sent_count = 0
        for event in pending_events:
            remind_at = event.start_time - timedelta(minutes=event.notify_minutes_before)

            # If it's time to remind (within a 1-minute window) and event hasn't started yet
            if remind_at <= now < event.start_time:
                try:
                    send_mail(
                        subject=f"⏰ Reminder: {event.title} starts soon",
                        message=(
                            f"Hi {event.user.username},\n\n"
                            f"Your {event.event_type} \"{event.title}\" starts at "
                            f"{event.start_time.strftime('%I:%M %p on %B %d')}.\n\n"
                            f"{event.description or ''}\n\n"
                            f"— SpendSync"
                        ),
                        from_email=None,  # uses EMAIL_HOST_USER from settings
                        recipient_list=[event.user.email],
                        fail_silently=False,
                    )
                    event.notification_sent = True
                    event.save()
                    sent_count += 1
                    self.stdout.write(self.style.SUCCESS(f"Sent reminder for: {event.title}"))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Failed to send for {event.title}: {e}"))

        if sent_count == 0:
            self.stdout.write("No reminders due right now.")
        else:
            self.stdout.write(self.style.SUCCESS(f"Done. Sent {sent_count} reminder(s)."))