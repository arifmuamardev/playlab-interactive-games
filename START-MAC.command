#!/bin/bash
set -e
cd "$(dirname "$0")"
PORT=8765
if command -v node >/dev/null 2>&1; then
  echo "Starting PlayLab interactive games with Node.js..."
  node serve.cjs &
  server_pid=$!
elif command -v python3 >/dev/null 2>&1; then
  echo "Starting PlayLab interactive games with Python 3..."
  cd dist
  python3 -m http.server "$PORT" --bind 127.0.0.1 &
  server_pid=$!
else
  echo "This laptop needs Node.js or Python 3 installed to start the local game."
  read -r -p "Press Enter to close..."
  exit 1
fi
trap 'kill "$server_pid" >/dev/null 2>&1 || true' EXIT
sleep 1
open "http://localhost:$PORT/" 2>/dev/null || true
echo ""
echo "Host:      http://localhost:$PORT/"
echo "Survey projector: http://localhost:$PORT/?game=survey&view=display"
echo "Keep this Terminal open while the game is running. Press Ctrl+C to stop."
wait "$server_pid"
