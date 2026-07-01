from rest_framework import serializers
from .models import Category, Transaction


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'type', 'icon', 'color']


class TransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_icon = serializers.CharField(source='category.icon', read_only=True)
    linked_person_name = serializers.CharField(source='linked_person.name', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'category', 'category_name', 'category_icon',
            'type', 'amount', 'title', 'notes', 'date',
            'linked_person', 'linked_person_name', 'created_at'
        ]