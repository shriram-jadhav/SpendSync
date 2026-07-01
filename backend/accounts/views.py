from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import User
from .serializers import RegisterSerializer, UserSerializer
from expenses.models import Category


DEFAULT_CATEGORIES = [
    {'name': 'Food', 'type': 'expense', 'icon': '🍔', 'color': '#f97316'},
    {'name': 'Travel', 'type': 'expense', 'icon': '🚗', 'color': '#3b82f6'},
    {'name': 'Shopping', 'type': 'expense', 'icon': '🛍️', 'color': '#ec4899'},
    {'name': 'Bills', 'type': 'expense', 'icon': '📄', 'color': '#ef4444'},
    {'name': 'Entertainment', 'type': 'expense', 'icon': '🎬', 'color': '#8b5cf6'},
    {'name': 'Health', 'type': 'expense', 'icon': '💊', 'color': '#14b8a6'},
    {'name': 'Other', 'type': 'expense', 'icon': '📦', 'color': '#6b7280'},
    {'name': 'Salary', 'type': 'income', 'icon': '💰', 'color': '#22c55e'},
    {'name': 'Freelance', 'type': 'income', 'icon': '💻', 'color': '#06b6d4'},
]


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        user = serializer.save()
        for cat in DEFAULT_CATEGORIES:
            Category.objects.create(user=user, **cat)


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)