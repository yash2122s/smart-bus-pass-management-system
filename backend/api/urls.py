"""
API URL patterns — matches the exact paths the React frontend calls.
No trailing slashes (APPEND_SLASH=False in settings).
"""
from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('login', views.LoginView.as_view(), name='login'),
    path('register', views.RegisterView.as_view(), name='register'),
    path('conductor/login', views.ConductorLoginView.as_view(), name='conductor-login'),

    # Passes — specific routes before generic <pk> route
    path('passes/user/<str:user_id>', views.UserPassesView.as_view(), name='user-passes'),
    path('passes/verify/<str:pass_id>', views.VerifyPassView.as_view(), name='verify-pass'),
    path('passes/<str:pk>', views.PassUpdateView.as_view(), name='pass-update'),
    path('passes', views.PassListCreateView.as_view(), name='pass-list-create'),

    # Users
    path('users', views.UserListView.as_view(), name='user-list'),

    # Stats
    path('stats', views.StatsView.as_view(), name='stats'),
]
