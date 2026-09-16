from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User
from .models import Expense, Income, Budget, CategoryBudget, SavingsGoal
from .serializers import (
    ExpenseSerializer, 
    IncomeSerializer, 
    BudgetSerializer,
    SavingsGoalSerializer
)

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email', '')

        if not username or not password:
            return Response({'error': 'Username and password are required'}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists. Please choose a different one.'}, status=status.HTTP_400_BAD_REQUEST)

        User.objects.create_user(username=username, password=password, email=email)
        return Response({'message': 'User registered successfully'}, status=status.HTTP_201_CREATED)


class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Expense.objects.filter(user=self.request.user).order_by('-date', '-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class IncomeViewSet(viewsets.ModelViewSet):
    serializer_class = IncomeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Income.objects.filter(user=self.request.user).order_by('-date', '-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class BudgetViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user).order_by('-year', '-month')

    def create(self, request, *args, **kwargs):
        try:
            month = request.data.get('month')
            year = request.data.get('year')
            total_amount = request.data.get('total_amount')
            allocations = request.data.get('category_allocations', [])

            if not month or not year or not total_amount:
                return Response(
                    {'error': 'Month, year and total_amount are required.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            budget, _ = Budget.objects.update_or_create(
                user=request.user,
                month=int(month),
                year=int(year),
                defaults={'total_amount': float(total_amount)}
            )

            budget.category_allocations.all().delete()
            for alloc in allocations:
                cat = alloc.get('category')
                amt = alloc.get('allocated_amount')
                if cat and amt and float(amt) > 0:
                    CategoryBudget.objects.create(
                        budget=budget,
                        category=cat,
                        allocated_amount=float(amt)
                    )

            serializer = self.get_serializer(budget)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# Naya SavingsGoalViewSet
class SavingsGoalViewSet(viewsets.ModelViewSet):
    serializer_class = SavingsGoalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Strict User Ownership Isolation
        return SavingsGoal.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class DashboardSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        expenses = Expense.objects.filter(user=user)
        incomes = Income.objects.filter(user=user)

        total_income = sum(float(i.amount) for i in incomes)
        total_expense = sum(float(e.amount) for e in expenses)
        remaining_amount = total_income - total_expense

        combined_activity = []
        for e in expenses:
            combined_activity.append({
                'id': f"exp_{e.id}",
                'original_id': e.id,
                'title': e.title,
                'amount': float(e.amount),
                'category': e.category,
                'type': 'EXPENSE',
                'date': str(e.date),
                'created_at': e.created_at.isoformat()
            })

        for i in incomes:
            src = i.income_type or getattr(i, 'source', 'Pocket Money')
            combined_activity.append({
                'id': f"inc_{i.id}",
                'original_id': i.id,
                'title': src,
                'amount': float(i.amount),
                'category': src,
                'type': 'INCOME',
                'date': str(i.date),
                'created_at': i.created_at.isoformat() if hasattr(i, 'created_at') else ''
            })

        combined_activity.sort(key=lambda x: x['date'], reverse=True)

        return Response({
            'total_income': total_income,
            'total_expenses': total_expense,
            'remaining_amount': remaining_amount,
            'recent_activity': combined_activity[:10],
            'all_transactions': combined_activity
        })