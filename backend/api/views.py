"""
API Views for TransitPass Django backend.
Each view replicates the exact request/response contract of the Express API
so the React frontend works with zero changes (except BASE_URL port).
"""
import time
from datetime import date

from django.contrib.auth.hashers import check_password, make_password
from django.db.models import Q, Count
from django.utils.decorators import method_decorator

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from django_ratelimit.decorators import ratelimit

from .models import Citizen, SystemAdmin, Conductor, Pass
from .serializers import (
    LoginSerializer, RegisterSerializer, ConductorLoginSerializer,
    CitizenSerializer, PassCreateSerializer, PassResponseSerializer,
    PassUpdateSerializer,
)
from .permissions import generate_token, IsAdminRole, IsAuthenticated


# ─────────────────────────────────────────────
#  AUTH ENDPOINTS
# ─────────────────────────────────────────────

@method_decorator(
    ratelimit(key='ip', rate='100/15m', method='POST', block=True),
    name='dispatch'
)
class LoginView(APIView):
    """
    POST /api/login
    Checks both Citizen and SystemAdmin tables (mirrors Express behavior).
    Returns: { user: { id, name, email|username, role }, token }
    """

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'message': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        email_input = serializer.validated_data['email'].strip()
        password_input = serializer.validated_data['password'].strip()

        # 1) Check Citizens (by email)
        try:
            citizen = Citizen.objects.get(email=email_input)
            if check_password(password_input, citizen.password):
                token = generate_token({
                    'id': citizen.id,
                    'role': 'user',
                    'email': citizen.email,
                    'name': citizen.name,
                })
                return Response({
                    'user': {
                        'id': citizen.id,
                        'name': citizen.name,
                        'email': citizen.email,
                        'role': 'user',
                    },
                    'token': token,
                })
        except Citizen.DoesNotExist:
            pass

        # 2) Check Admins (by username, case-insensitive)
        try:
            admin = SystemAdmin.objects.get(username__iexact=email_input)
            if check_password(password_input, admin.password):
                token = generate_token({
                    'id': admin.id,
                    'role': 'admin',
                    'username': admin.username,
                    'name': admin.name,
                })
                return Response({
                    'user': {
                        'id': admin.id,
                        'username': admin.username,
                        'name': admin.name,
                        'role': 'admin',
                    },
                    'token': token,
                })
        except SystemAdmin.DoesNotExist:
            pass

        return Response({'message': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


class RegisterView(APIView):
    """
    POST /api/register
    Creates a new Citizen account.
    Returns: { user: { id, name, email, role: 'user' }, token }
    """

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            errors = serializer.errors
            # Return first error message like Express does
            for field, msgs in errors.items():
                message = msgs[0] if isinstance(msgs, list) else str(msgs)
                return Response({'message': str(message)}, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        citizen_id = f"user_{int(time.time() * 1000)}"

        citizen = Citizen.objects.create(
            id=citizen_id,
            name=data['name'],
            email=data['email'],
            password=make_password(data['password']),
        )

        token = generate_token({
            'id': citizen.id,
            'role': 'user',
            'email': citizen.email,
            'name': citizen.name,
        })

        return Response({
            'user': {
                'id': citizen.id,
                'name': citizen.name,
                'email': citizen.email,
                'role': 'user',
            },
            'token': token,
        })


@method_decorator(
    ratelimit(key='ip', rate='100/15m', method='POST', block=True),
    name='dispatch'
)
class ConductorLoginView(APIView):
    """
    POST /api/conductor/login
    Authenticates conductor by ID + PIN (both stored in database, PIN hashed).
    Returns: { conductor: { id, name, route }, token }
    """

    def post(self, request):
        serializer = ConductorLoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'message': 'Invalid Conductor ID or PIN'}, status=status.HTTP_401_UNAUTHORIZED)

        cond_id = serializer.validated_data['id'].strip().upper()
        pin = serializer.validated_data['pin'].strip()

        try:
            conductor = Conductor.objects.get(id=cond_id, is_active=True)
            if check_password(pin, conductor.pin):
                token = generate_token({
                    'id': conductor.id,
                    'role': 'conductor',
                    'name': conductor.name,
                    'route': conductor.route,
                })
                return Response({
                    'conductor': {
                        'id': conductor.id,
                        'name': conductor.name,
                        'route': conductor.route,
                    },
                    'token': token,
                })
        except Conductor.DoesNotExist:
            pass

        return Response({'message': 'Invalid Conductor ID or PIN'}, status=status.HTTP_401_UNAUTHORIZED)


# ─────────────────────────────────────────────
#  PASS ENDPOINTS
# ─────────────────────────────────────────────

class PassListCreateView(APIView):
    """
    GET  /api/passes           → Admin only: list all passes (with optional filters)
    POST /api/passes           → Authenticated user: submit new pass application

    GET supports query params:
      ?status=pending          → filter by status
      ?category=Student        → filter by passType
      ?search=john             → search name/email/passId
      ?page=1&limit=20         → paginate (optional; without these, returns plain array)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response({'message': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

        queryset = Pass.objects.all()

        # --- Filters ---
        filter_status = request.query_params.get('status')
        filter_category = request.query_params.get('category')
        search = request.query_params.get('search')

        if filter_status:
            queryset = queryset.filter(status=filter_status)
        if filter_category:
            queryset = queryset.filter(pass_type__icontains=filter_category)
        if search:
            queryset = queryset.filter(
                Q(user_name__icontains=search) |
                Q(user_email__icontains=search) |
                Q(pass_id__icontains=search) |
                Q(full_name__icontains=search)
            )

        # --- Pagination (opt-in) ---
        page_param = request.query_params.get('page')
        limit_param = request.query_params.get('limit')

        if page_param and limit_param:
            try:
                page = max(int(page_param), 1)
                limit = min(max(int(limit_param), 1), 100)
            except (ValueError, TypeError):
                page, limit = 1, 20

            total = queryset.count()
            start = (page - 1) * limit
            end = start + limit
            page_qs = queryset[start:end]

            serializer = PassResponseSerializer(page_qs, many=True)
            return Response({
                'results': serializer.data,
                'count': total,
                'next': page + 1 if end < total else None,
                'previous': page - 1 if page > 1 else None,
            })

        # No pagination → return plain array (backward compat with frontend)
        serializer = PassResponseSerializer(queryset, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = PassCreateSerializer(data=request.data)
        if not serializer.is_valid():
            for field, msgs in serializer.errors.items():
                message = msgs[0] if isinstance(msgs, list) else str(msgs)
                return Response({'message': str(message)}, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        record_id = f"pass_{int(time.time() * 1000)}"
        created_at = __import__('datetime').datetime.now().isoformat()

        # Extract user info from JWT (mirrors Express: req.user.id, req.user.name)
        user = request.user
        user_name = user.name or data['fullName']
        user_email = user.email or data.get('email', '')

        Pass.objects.create(
            id=record_id,
            pass_id=data['passId'],
            user_id=user.id,
            user_name=user_name,
            user_email=user_email,
            full_name=data['fullName'],
            email=data.get('email', ''),
            phone=data['phone'],
            pass_type=data['passType'],
            start_date=data['startDate'],
            expiry_date=data['expiryDate'],
            duration=data['duration'],
            status='pending',
            created_at=created_at,
        )

        return Response({
            'id': record_id,
            'passId': data['passId'],
            'status': 'pending',
            'createdAt': created_at,
        })


class UserPassesView(APIView):
    """
    GET /api/passes/user/{userId}
    Returns passes for a specific user. Users can only see their own;
    admins can see anyone's.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        if request.user.role != 'admin' and request.user.id != user_id:
            return Response({'message': 'Unauthorized access.'}, status=status.HTTP_403_FORBIDDEN)

        passes = Pass.objects.filter(user_id=user_id)
        serializer = PassResponseSerializer(passes, many=True)
        return Response(serializer.data)


class VerifyPassView(APIView):
    """
    GET /api/passes/verify/{passId}
    Public endpoint — verifies a pass by its display ID (e.g., TP-GN2604A3F2).
    Returns full pass info with computed status.
    """

    def get(self, request, pass_id):
        try:
            pass_obj = Pass.objects.get(pass_id__iexact=pass_id)
        except Pass.DoesNotExist:
            return Response({'message': 'Pass not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = PassResponseSerializer(pass_obj)
        return Response(serializer.data)


class PassUpdateView(APIView):
    """
    PATCH /api/passes/{id}
    Admin only — update pass status (approve/reject with optional reason).
    """
    permission_classes = [IsAuthenticated, IsAdminRole]

    def patch(self, request, pk):
        try:
            pass_obj = Pass.objects.get(pk=pk)
        except Pass.DoesNotExist:
            return Response({'message': 'Pass not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = PassUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'message': 'Invalid data'}, status=status.HTTP_400_BAD_REQUEST)

        new_status = serializer.validated_data['status']
        rejection_reason = serializer.validated_data.get('rejectionReason')

        pass_obj.status = new_status
        if new_status == 'rejected' and rejection_reason:
            pass_obj.rejection_reason = rejection_reason
        else:
            pass_obj.rejection_reason = None
        pass_obj.save()

        return Response({'success': True})


# ─────────────────────────────────────────────
#  USER & STATS ENDPOINTS
# ─────────────────────────────────────────────

class UserListView(APIView):
    """
    GET /api/users
    Admin only — returns all registered citizens (no passwords).
    """
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        citizens = Citizen.objects.all()
        serializer = CitizenSerializer(citizens, many=True)
        return Response(serializer.data)


class StatsView(APIView):
    """
    GET /api/stats
    Admin only — aggregated dashboard statistics.
    """
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        citizens_count = Citizen.objects.count()
        all_passes = Pass.objects.all()
        total_apps = all_passes.count()

        # Count by stored status
        approved_count = all_passes.filter(status='approved').count()
        pending_count = all_passes.filter(status='pending').count()
        rejected_count = all_passes.filter(status='rejected').count()

        # Count active today (approved passes within date range)
        today_str = date.today().isoformat()
        active_today = all_passes.filter(
            status='approved',
            start_date__lte=today_str,
            expiry_date__gte=today_str,
        ).count()

        # By category
        category_counts = {}
        for entry in all_passes.values('pass_type').annotate(cnt=Count('id')):
            category_counts[entry['pass_type']] = entry['cnt']

        return Response({
            'total_citizens': citizens_count,
            'total_applications': total_apps,
            'approved_count': approved_count,
            'active_today': active_today,
            'by_category': category_counts,
            'approval_rate': {
                'approved': approved_count,
                'pending': pending_count,
                'rejected': rejected_count,
            },
        })
