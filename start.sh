#!/bin/sh
cd "$(dirname "$0")"
python3 -m http.server 8080 &
sleep 1
if command -v xdg-open > /dev/null; then
  xdg-open "http://localhost:8080/blink_image_gen.html"
elif command -v open > /dev/null; then
  open "http://localhost:8080/blink_image_gen.html"
else
  echo "Откройте в браузере: http://localhost:8080/blink_image_gen.html"
fi
wait