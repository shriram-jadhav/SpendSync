from rest_framework import viewsets, permissions
from .models import Person, LedgerEntry
from .serializers import PersonSerializer, LedgerEntrySerializer
from expenses.models import Category, Transaction


class PersonViewSet(viewsets.ModelViewSet):
    serializer_class = PersonSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Person.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class LedgerEntryViewSet(viewsets.ModelViewSet):
    serializer_class = LedgerEntrySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return LedgerEntry.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        entry = serializer.save(user=self.request.user)
        self._sync_to_expense(entry)

    def _sync_to_expense(self, entry):
        """
        Auto-creates a linked Transaction in the expense tracker:
        - 'lent' (you gave money) → counted as an expense
        - 'borrowed' (you took money) → counted as income
        """
        if entry.entry_type == 'settled':
            return  # no transaction needed for settlements

        category, _ = Category.objects.get_or_create(
            user=entry.user,
            name='Personal Lending',
            type='expense' if entry.entry_type == 'lent' else 'income',
            defaults={'icon': '🤝', 'color': '#f59e0b'}
        )

        txn_type = 'expense' if entry.entry_type == 'lent' else 'income'
        title = f"{'Gave money to' if entry.entry_type == 'lent' else 'Took money from'} {entry.person.name}"

        Transaction.objects.create(
            user=entry.user,
            category=category,
            type=txn_type,
            amount=entry.amount,
            title=title,
            notes=entry.description,
            date=entry.date,
            linked_person=entry.person
        )

        entry.synced_to_expense = True
        entry.save()