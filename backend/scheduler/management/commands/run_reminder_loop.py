import time
from django.core.management.base import BaseCommand
from django.core.management import call_command


class Command(BaseCommand):
    help = 'Runs send_reminders every 60 seconds, forever (for local development)'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Reminder loop started. Checking every 60 seconds... (Ctrl+C to stop)'))
        while True:
            call_command('send_reminders')
            time.sleep(60)