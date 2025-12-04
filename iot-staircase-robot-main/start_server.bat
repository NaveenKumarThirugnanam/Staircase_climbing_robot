@echo off
echo ========================================
echo  Starting Django Server
echo ========================================
echo.
cd /d "%~dp0"
python -m daphne -p 8000 staircasebot.asgi:application
pause
