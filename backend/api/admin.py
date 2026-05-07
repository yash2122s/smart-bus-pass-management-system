from django.contrib import admin
from django.contrib.auth.hashers import make_password
from .models import Citizen, SystemAdmin, Conductor, Pass


@admin.register(Citizen)
class CitizenAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'email')
    search_fields = ('name', 'email')

    def save_model(self, request, obj, form, change):
        # Hash password if it's being set/changed
        if obj.password and not obj.password.startswith('pbkdf2_') and not obj.password.startswith('bcrypt'):
            obj.password = make_password(obj.password)
        super().save_model(request, obj, form, change)


@admin.register(SystemAdmin)
class SystemAdminAdmin(admin.ModelAdmin):
    list_display = ('id', 'username', 'name')
    search_fields = ('username', 'name')

    def save_model(self, request, obj, form, change):
        # Hash password if it's being set/changed
        if obj.password and not obj.password.startswith('pbkdf2_') and not obj.password.startswith('bcrypt'):
            obj.password = make_password(obj.password)
        super().save_model(request, obj, form, change)


@admin.register(Conductor)
class ConductorAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'route', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name', 'route')

    def save_model(self, request, obj, form, change):
        # Hash PIN if it's being set/changed
        if obj.pin and not obj.pin.startswith('pbkdf2_') and not obj.pin.startswith('bcrypt'):
            obj.pin = make_password(obj.pin)
        super().save_model(request, obj, form, change)


@admin.register(Pass)
class PassAdmin(admin.ModelAdmin):
    list_display = ('id', 'pass_id', 'full_name', 'pass_type', 'status', 'created_at')
    list_filter = ('status', 'pass_type')
    search_fields = ('pass_id', 'full_name', 'user_email')
    readonly_fields = ('id', 'created_at')
