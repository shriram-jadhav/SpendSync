from django.db import models
from django.conf import settings


class Event(models.Model):
    EVENT_TYPES = (
        ('meeting', 'Meeting'),
        ('session', 'Session'),
        ('study', 'Study'),
        ('work', 'Work'),
        ('other', 'Other'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='events')
    title = models.CharField(max_length=150)
    description = models.TextField(blank=True, null=True)
    event_type = models.CharField(max_length=10, choices=EVENT_TYPES, default='other')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()

    notify = models.BooleanField(default=False)
    notify_minutes_before = models.PositiveIntegerField(default=30)  # remind 30 mins before
    notification_sent = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['start_time']

    def __str__(self):
        return f"{self.title} ({self.start_time.strftime('%Y-%m-%d %H:%M')})"