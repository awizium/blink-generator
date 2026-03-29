@echo off
cd /d "%~dp0"
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo Python не найден! Скачайте с https://python.org
    pause
    exit /b
)
start "" "http://localhost:8080/blink_image_gen.html"
python -m http.server 8080
pause