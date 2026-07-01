from rest_framework import viewsets, permissions
from django.db.models import Sum
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Category, Transaction
from .serializers import CategorySerializer, TransactionSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Transaction.objects.filter(user=self.request.user)
        # Optional filters via query params
        type_filter = self.request.query_params.get('type')
        category_filter = self.request.query_params.get('category')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if type_filter:
            queryset = queryset.filter(type=type_filter)
        if category_filter:
            queryset = queryset.filter(category_id=category_filter)
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)

        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Returns income, expense, and balance totals"""
        qs = self.get_queryset()
        income = qs.filter(type='income').aggregate(total=Sum('amount'))['total'] or 0
        expense = qs.filter(type='expense').aggregate(total=Sum('amount'))['total'] or 0
        return Response({
            'total_income': income,
            'total_expense': expense,
            'balance': income - expense
        })

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Returns spending grouped by category — for pie charts"""
        qs = self.get_queryset().filter(type='expense')
        data = qs.values('category__name', 'category__color', 'category__icon').annotate(
            total=Sum('amount')
        ).order_by('-total')
        return Response(data)