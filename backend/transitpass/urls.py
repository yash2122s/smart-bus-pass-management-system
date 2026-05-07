"""
Root URL configuration for TransitPass Django project.
All API routes are under /api/ to match frontend expectations.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),           # Django admin site
    path('api/', include('api.urls')),          # TransitPass REST API
]
