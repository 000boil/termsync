#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

command -v node >/dev/null || { echo "need node 18+"; exit 1; }

npm install --silent
npm run build --silent
npm link --silent 2>/dev/null || true

echo ""
echo "run: termsync"
echo ""
