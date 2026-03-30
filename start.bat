@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo  ╔═══════════════════════════╗
echo  ║    🎨 Blink Generator     ║
echo  ╚═══════════════════════════╝
echo.

:: Проверяем Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo  [!] Python не найден! Скачайте с https://python.org
    pause
    exit /b
)

:: Обновление из GitHub (если есть git)
where git >nul 2>nul
if %errorlevel%==0 (
    echo  [*] Проверяю обновления...
    git pull --ff-only 2>nul
    if %errorlevel%==0 (
        echo  [+] Актуальная версия
    ) else (
        echo  [!] Не удалось обновить, продолжаю...
    )
    echo.
)

echo  [*] Запускаю на http://localhost:8080
echo  [*] Ctrl+C для остановки
echo.

start "" "http://localhost:8080/index.html"
python -c "import http.server,functools;h=type('H',(http.server.SimpleHTTPRequestHandler,),{'end_headers':lambda s:(s.send_header('Cache-Control','no-store'),http.server.SimpleHTTPRequestHandler.end_headers(s))});http.server.HTTPServer(('',8080),h).serve_forever()"
pause
