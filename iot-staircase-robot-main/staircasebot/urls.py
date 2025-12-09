"""
URL configuration for staircasebot project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from django.contrib.auth import views as auth_views
from robot import views
from django.conf import settings           # ← YOU MISSED THIS
from django.conf.urls.static import static  # ← And this one


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.home_redirect, name='home'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('register/', views.register_view, name='register'),
    # Password reset (forgot password)
    path('password-reset/',
         auth_views.PasswordResetView.as_view(template_name='robot/password_reset.html'),
         name='password_reset'),
    path('password-reset/done/',
         auth_views.PasswordResetDoneView.as_view(template_name='robot/password_reset_done.html'),
         name='password_reset_done'),
    path('reset/<uidb64>/<token>/',
         auth_views.PasswordResetConfirmView.as_view(template_name='robot/password_reset_confirm.html'),
         name='password_reset_confirm'),
    path('reset/done/',
         auth_views.PasswordResetCompleteView.as_view(template_name='robot/password_reset_complete.html'),
         name='password_reset_complete'),
    # Password change (requires login)
    path('password-change/',
         auth_views.PasswordChangeView.as_view(template_name='robot/password_change.html'),
         name='password_change'),
    path('password-change/done/',
         auth_views.PasswordChangeDoneView.as_view(template_name='robot/password_change_done.html'),
         name='password_change_done'),
    path('profile/', views.profile_view, name='profile'),
    path('settings/', views.settings_view, name='settings'),
    # Robot pages
    path('robot/loading/', views.robot_loading, name='robot_loading'),
    path('robot/controller/', views.robot_controller, name='robot_controller'),
    path('robot/dashboard/', views.robot_dashboard, name='robot_dashboard'),
    path('api/battery-history/', views.battery_history, name='battery_history'),
    # Backward-compatible route
    path('robot/', views.robot_controller, name='robot'),
]

# Serve static files during development even when using Daphne
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
