from rest_framework import serializers
from .models import Person, LedgerEntry


class PersonSerializer(serializers.ModelSerializer):
    balance = serializers.ReadOnlyField()

    class Meta:
        model = Person
        fields = ['id', 'name', 'phone_number', 'notes', 'balance', 'created_at']


class LedgerEntrySerializer(serializers.ModelSerializer):
    person_name = serializers.CharField(source='person.name', read_only=True)

    class Meta:
        model = LedgerEntry
        fields = [
            'id', 'person', 'person_name', 'entry_type',
            'amount', 'description', 'date', 'synced_to_expense', 'created_at'
        ]
        read_only_fields = ['synced_to_expense']