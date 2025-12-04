@echo off
echo ========================================
echo  Camera WebSocket System - Launcher
echo ========================================
echo.
echo This will install required packages...
echo.

pip install opencv-python websockets

echo.
echo ========================================
echo Installation complete!
echo ========================================
echo.
echo To start the system:
echo.
echo 1. Open Terminal 1 and run:
echo    python -m daphne -p 8000 staircasebot.asgi:application
echo.
echo 2. Open Terminal 2 and run:
echo    python robot_client.py robot_01
echo.
echo 3. Open browser:
echo    http://localhost:8000/robot/
echo.
pause
