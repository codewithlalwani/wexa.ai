#!/usr/bin/env bash
set -euo pipefail

npm run build
mkdir -p .next/standalone/public
# Git does not preserve empty directories, so public may not exist on Render.
if [ -d public ]; then
  cp -R public/. .next/standalone/public/
fi
cp -R .next/static .next/standalone/.next/
