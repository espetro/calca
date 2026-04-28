#!/usr/bin/env bash
set -euo pipefail

echo "==> Building web app..."
cd ../..
bun run --filter=@app/web build

echo "==> Copying web build to desktop Resources..."
mkdir -p platforms/desktop/Resources/web
cp -r apps/web/dist/* platforms/desktop/Resources/web/

echo "==> Copying version.json..."
mkdir -p platforms/desktop/Resources
cp apps/Resources/version.json platforms/desktop/Resources/

echo "==> Building Electrobun app..."
cd platforms/desktop
./node_modules/.bin/electrobun build --env=stable

echo "==> Done! Artifacts in platforms/desktop/artifacts/"
