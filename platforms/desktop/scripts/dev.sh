#!/usr/bin/env bash
set -euo pipefail

# Coordinates the Vite dev server and Electrobun desktop app.
# The desktop process embeds the API server, so @app/server does not run standalone.

cd "$(dirname "$0")/../.."

echo "==> Starting web dev server..."
bun run --filter=@app/web dev &
VITE_PID=$!

cleanup() {
    echo "==> Shutting down..."
    kill $VITE_PID 2>/dev/null || true
    wait $VITE_PID 2>/dev/null || true
    exit
}

trap cleanup INT TERM EXIT

echo "==> Waiting for Vite dev server to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:5173 >/dev/null 2>&1; then
        echo "==> Vite is ready"
        break
    fi
    sleep 0.5
done

echo "==> Starting Electrobun desktop app..."
bun run --filter=@app/electrobun dev
