from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.urls import reverse
from django.contrib.auth.models import User

def home_redirect(request):
    if request.user.is_authenticated:
        return redirect('robot_controller')
    return redirect('login')



def login_view(request):
    if request.method == 'POST':
        identifier = request.POST.get('username')
        password = request.POST.get('password')
        user = None
        if identifier:
            # Try username directly
            user = authenticate(request, username=identifier, password=password)
            # If that fails and identifier looks like an email, try resolving to username
            if user is None and '@' in identifier:
                try:
                    from django.contrib.auth.models import User
                    related = User.objects.filter(email__iexact=identifier).first()
                    if related:
                        user = authenticate(request, username=related.username, password=password)
                except Exception:
                    user = None
        if user is not None:
            login(request, user)
            loading_url = reverse('robot_loading') + '?view=controller'
            return redirect(loading_url)
        else:
            messages.error(request, 'Invalid username or password')

    return render(request, 'robot/login.html')



@login_required(login_url='login')
def robot_loading(request):
    return render(request, 'robot/loading.html', {
        'user': request.user,
    })

@login_required(login_url='login')
def robot_controller(request):
    return render(request, 'robot/controller.html', {
        'user': request.user,
    })

@login_required(login_url='login')
def robot_dashboard(request):
    return render(request, 'robot/dashboard.html', {
        'user': request.user,
    })

def logout_view(request):
    logout(request)
    return redirect('login')

def register_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        password = request.POST.get('password')
        confirm = request.POST.get('confirm_password')

        if not username or not password or not email:
            messages.error(request, 'All fields are required.')
            return render(request, 'robot/register.html')

        if password != confirm:
            messages.error(request, 'Passwords do not match.')
            return render(request, 'robot/register.html')

        if User.objects.filter(username=username).exists():
            messages.error(request, 'Username already taken.')
            return render(request, 'robot/register.html')

        if User.objects.filter(email=email).exists():
            messages.error(request, 'Email already registered.')
            return render(request, 'robot/register.html')

        user = User.objects.create_user(username=username, email=email, password=password)
        login(request, user)
        return redirect('robot')

    return render(request, 'robot/register.html')

@login_required(login_url='login')
def profile_view(request):
    return render(request, 'robot/profile.html', {'user': request.user})

@login_required(login_url='login')
def settings_view(request):
    if request.method == 'POST':
        first_name = request.POST.get('first_name', '').strip()
        last_name = request.POST.get('last_name', '').strip()
        email = request.POST.get('email', '').strip()

        user = request.user
        changed = False

        if first_name != user.first_name:
            user.first_name = first_name
            changed = True
        if last_name != user.last_name:
            user.last_name = last_name
            changed = True
        if email and email != user.email:
            # Simple conflict check
            if User.objects.filter(email__iexact=email).exclude(pk=user.pk).exists():
                messages.error(request, 'Email is already in use by another account.')
            else:
                user.email = email
                changed = True

        if changed:
            user.save()
            messages.success(request, 'Settings updated successfully.')
        else:
            messages.info(request, 'No changes to update.')

    return render(request, 'robot/settings.html', {'user': request.user})
