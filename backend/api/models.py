"""
Models for TransitPass API.
Maps directly to the existing Express/SQLite schema with snake_case naming.
"""
from django.db import models
from datetime import date


class Citizen(models.Model):
    """Replaces the 'users' table from Express backend."""
    id = models.CharField(max_length=50, primary_key=True)       # 'user_{timestamp}'
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)                   # Django hashed password

    class Meta:
        db_table = 'citizens'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.email})"


class SystemAdmin(models.Model):
    """Replaces the 'admins' table. Named SystemAdmin to avoid collision with django.contrib.admin."""
    id = models.CharField(max_length=50, primary_key=True)       # 'admin_1'
    username = models.CharField(max_length=100, unique=True)
    password = models.CharField(max_length=255)                   # Django hashed password
    name = models.CharField(max_length=255)

    class Meta:
        db_table = 'system_admins'

    def __str__(self):
        return f"{self.name} ({self.username})"


class Conductor(models.Model):
    """New model — conductors were previously hardcoded in the frontend."""
    id = models.CharField(max_length=20, primary_key=True)       # 'COND001'
    name = models.CharField(max_length=255)
    pin = models.CharField(max_length=255)                        # Django hashed PIN
    route = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'conductors'

    def __str__(self):
        return f"{self.name} — {self.route}"


class Pass(models.Model):
    """Replaces the 'passes' table. Adds rejection_reason field."""
    id = models.CharField(max_length=50, primary_key=True)       # 'pass_{timestamp}'
    pass_id = models.CharField(max_length=50)                     # 'TP-ST2604A3F2' (display ID)
    user_id = models.CharField(max_length=50)                     # FK to Citizen.id
    user_name = models.CharField(max_length=255)
    user_email = models.CharField(max_length=255)
    full_name = models.CharField(max_length=255)
    email = models.CharField(max_length=255, blank=True, default='')
    phone = models.CharField(max_length=20)
    pass_type = models.CharField(max_length=100)
    start_date = models.CharField(max_length=20)                  # 'YYYY-MM-DD'
    expiry_date = models.CharField(max_length=20)                 # 'YYYY-MM-DD'
    duration = models.IntegerField()
    status = models.CharField(max_length=20, default='pending')   # pending | approved | rejected
    rejection_reason = models.TextField(null=True, blank=True)
    created_at = models.CharField(max_length=50)                  # ISO timestamp

    class Meta:
        db_table = 'passes'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.pass_id} — {self.full_name} ({self.status})"

    @property
    def computed_status(self):
        """
        Replicates the Express computePassStatus() logic:
        - pending/rejected passes keep their admin-set status
        - approved passes get date-based status (upcoming/active/expired)
        """
        if self.status in ('pending', 'rejected'):
            return self.status

        today = date.today()
        try:
            start = date.fromisoformat(self.start_date)
            end = date.fromisoformat(self.expiry_date)
        except (ValueError, TypeError):
            return self.status

        if today < start:
            return 'upcoming'
        if today > end:
            return 'expired'
        return 'active'
