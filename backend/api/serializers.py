"""
DRF Serializers for TransitPass API.
All serializer field names use camelCase to match the React frontend's expectations.
The 'source' parameter maps camelCase field names to snake_case model fields.
"""
from rest_framework import serializers
from .models import Citizen, Pass


class CitizenSerializer(serializers.Serializer):
    """Serializes Citizen for GET /api/users (admin view)."""
    id = serializers.CharField()
    name = serializers.CharField()
    email = serializers.EmailField()


class RegisterSerializer(serializers.Serializer):
    """Validates POST /api/register input."""
    name = serializers.CharField(min_length=2, max_length=255)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=6, write_only=True)

    def validate_email(self, value):
        if Citizen.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('Email already registered')
        return value.lower()


class LoginSerializer(serializers.Serializer):
    """Validates POST /api/login input."""
    email = serializers.CharField(required=True)
    password = serializers.CharField(required=True)


class ConductorLoginSerializer(serializers.Serializer):
    """Validates POST /api/conductor/login input."""
    id = serializers.CharField(required=True)
    pin = serializers.CharField(required=True)


class PassCreateSerializer(serializers.Serializer):
    """
    Validates POST /api/passes input.
    Field names match what the React frontend sends (camelCase).
    """
    fullName = serializers.CharField(max_length=255)
    email = serializers.CharField(max_length=255, required=False, default='', allow_blank=True)
    phone = serializers.CharField(max_length=20)
    passType = serializers.CharField(max_length=100)
    startDate = serializers.CharField(max_length=20)
    expiryDate = serializers.CharField(max_length=20)
    duration = serializers.IntegerField()
    passId = serializers.CharField(max_length=50)


class PassResponseSerializer(serializers.Serializer):
    """
    Serializes Pass model instances for API responses.
    Maps snake_case model fields to camelCase for the frontend.
    Uses computed_status for the 'status' field.
    """
    id = serializers.CharField()
    passId = serializers.CharField(source='pass_id')
    userId = serializers.CharField(source='user_id')
    userName = serializers.CharField(source='user_name')
    userEmail = serializers.CharField(source='user_email')
    fullName = serializers.CharField(source='full_name')
    email = serializers.CharField()
    phone = serializers.CharField()
    passType = serializers.CharField(source='pass_type')
    startDate = serializers.CharField(source='start_date')
    expiryDate = serializers.CharField(source='expiry_date')
    duration = serializers.IntegerField()
    status = serializers.CharField(source='computed_status')
    rejectionReason = serializers.CharField(source='rejection_reason', allow_null=True)
    createdAt = serializers.CharField(source='created_at')


class PassUpdateSerializer(serializers.Serializer):
    """
    Validates PATCH /api/passes/{id} input.
    Accepts camelCase from frontend.
    """
    status = serializers.ChoiceField(choices=['approved', 'rejected'])
    rejectionReason = serializers.CharField(required=False, allow_blank=True, allow_null=True)
