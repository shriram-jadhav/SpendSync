from django.db import models
from django.conf import settings


class Person(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='people')
    name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'name')

    def __str__(self):
        return self.name

    @property
    def balance(self):
        """
        Positive balance = this person owes YOU money.
        Negative balance = YOU owe this person money.
        """
        total = 0
        for entry in self.ledger_entries.all():
            if entry.entry_type == 'lent':       # you gave them money
                total += entry.amount
            elif entry.entry_type == 'borrowed':  # you took money from them
                total -= entry.amount
            elif entry.entry_type == 'settled':
                total = 0
        return total


class LedgerEntry(models.Model):
    ENTRY_TYPES = (
        ('lent', 'I Gave Money'),
        ('borrowed', 'I Took Money'),
        ('settled', 'Settled / Cleared'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ledger_entries')
    person = models.ForeignKey(Person, on_delete=models.CASCADE, related_name='ledger_entries')
    entry_type = models.CharField(max_length=10, choices=ENTRY_TYPES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.CharField(max_length=200, blank=True, null=True)
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    # auto-sync flag — True if this entry created a linked Transaction in expenses
    synced_to_expense = models.BooleanField(default=False)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.entry_type} - {self.person.name} - {self.amount}"