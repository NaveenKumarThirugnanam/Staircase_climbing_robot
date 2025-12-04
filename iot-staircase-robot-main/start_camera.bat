@echo off
echo ========================================
echo  Starting Camera Client
echo ========================================
echo.
cd /d "%~dp0"
python robot_client.py robot_01
pause
