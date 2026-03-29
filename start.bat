@echo off
cd /d "%~dp0"
start "" "http://localhost:8080/blink_image_gen.html"
python -m http.server 8080
pause
