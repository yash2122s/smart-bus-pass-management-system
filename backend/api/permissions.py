"""
Custom JWT authentication and permission classes.
Uses djangorestframework-simplejwt tokens with custom claims.
"""
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import BasePermission
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError


class TokenUser:
    """
    Lightweight user object extracted from JWT claims.
    Used instead of Django's User model since we have custom Citizen/Admin models.
    """
    def __init__(self, token):
        self.id = token.get('id', '')
        self.role = token.get('role', '')
        self.name = token.get('name', '')
        self.email = token.get('email', '')
        self.username = token.get('username', '')
        self.is_authenticated = True

    def __str__(self):
        return f"{self.name} ({self.role})"


class CustomJWTAuthentication(BaseAuthentication):
    """
    Custom DRF authentication class that validates simplejwt AccessTokens
    and creates a TokenUser from the JWT claims.
    """
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return None

        raw_token = auth_header.split(' ')[1]
        try:
            validated_token = AccessToken(raw_token)
            user = TokenUser(validated_token)
            return (user, raw_token)
        except TokenError:
            raise AuthenticationFailed('Invalid or expired token.')

    def authenticate_header(self, request):
        return 'Bearer'


def generate_token(payload: dict) -> str:
    """
    Generate a simplejwt AccessToken with custom claims.
    Lifetime is controlled by SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'] in settings.
    """
    token = AccessToken()
    for key, value in payload.items():
        token[key] = value
    return str(token)


# --- Permission classes ---

class IsAdminRole(BasePermission):
    """Only allows access to users with role='admin' in their JWT."""
    message = 'Admin access required.'

    def has_permission(self, request, view):
        return (
            request.user
            and hasattr(request.user, 'role')
            and request.user.role == 'admin'
        )


class IsAuthenticated(BasePermission):
    """Allows access to any authenticated user (any role)."""
    message = 'Access denied. No token provided.'

    def has_permission(self, request, view):
        return (
            request.user
            and hasattr(request.user, 'is_authenticated')
            and request.user.is_authenticated
        )
