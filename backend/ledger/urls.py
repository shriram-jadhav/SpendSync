from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PersonViewSet, LedgerEntryViewSet

router = DefaultRouter()
router.register('people', PersonViewSet, basename='person')
router.register('entries', LedgerEntryViewSet, basename='ledgerentry')

urlpatterns = [
    path('', include(router.urls)),
]