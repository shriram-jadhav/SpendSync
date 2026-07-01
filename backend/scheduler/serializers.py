from rest_framework import serializers
from .models import Event


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'event_type',
            'start_time', 'end_time', 'notify',
            'notify_minutes_before', 'notification_sent', 'created_at'
        ]
        read_only_fields = ['notification_sent']