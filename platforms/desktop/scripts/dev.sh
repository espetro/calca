#!/usr/bin/env bash
set -euo pipefail
# Start Vite dev server and Electrobun desktop side by side
cd ../..
bun run dev-web &
VITE_PID=$!
sleep 3
cd platforms/desktop
bun run dev
kill $VITE_PID 2>/dev/null