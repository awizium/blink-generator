#!/usr/bin/env bash
cd "$(dirname "$0")"

echo ""
echo "  ╔═══════════════════════════╗ "
echo "  ║    🎨 Blink Generator     ║ "
echo "  ╚═══════════════════════════╝ "
echo ""

# Проверяем Python
if ! command -v python3 &>/dev/null; then
    if ! command -v python &>/dev/null; then
        echo "  [!] Python не найден!"
        echo "  Установите: sudo apt install python3  (Linux)"
        echo "              brew install python3       (macOS)"
        exit 1
    fi
    PY=python
else
    PY=python3
fi

# Обновление из GitHub (если есть git)
if command -v git &>/dev/null; then
    echo "  [*] Проверяю обновления..."
    if git pull --ff-only 2>/dev/null; then
        echo "  [+] Актуальная версия"
    else
        echo "  [!] Не удалось обновить, продолжаю..."
    fi
    echo ""
fi

echo "  [*] Запускаю на http://localhost:8080"
echo "  [*] Ctrl+C для остановки"
echo ""

# Открываем браузер (фон)
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "http://localhost:8080/blink_image_gen.html" 2>/dev/null &
else
    xdg-open "http://localhost:8080/blink_image_gen.html" 2>/dev/null &
fi

# Запускаем сервер с отключённым кэшем
$PY -c "
import http.server

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

print('  [+] Сервер запущен')
http.server.HTTPServer(('', 8080), NoCacheHandler).serve_forever()
"
