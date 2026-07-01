from django.urls import path
from .views import ParseTransactionView

urlpatterns = [
    path('parse-transaction/', ParseTransactionView.as_view(), name='parse-transaction'),
]