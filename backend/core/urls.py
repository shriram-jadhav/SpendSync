from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/expenses/', include('expenses.urls')),
    path('api/ledger/', include('ledger.urls')),
    path('api/scheduler/', include('scheduler.urls')),
    path('api/ai/', include('ai.urls')),
]