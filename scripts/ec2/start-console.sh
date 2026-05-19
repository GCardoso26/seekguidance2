#!/usr/bin/env bash
# Runtime Console v3 na EC2 (dev; browser usa /api/proxy → API local).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT/frontend/runtime_console_v3"

if [[ ! -d node_modules ]]; then
  echo "==> npm install"
  npm install
fi

export API_PROXY_TARGET="${API_PROXY_TARGET:-http://127.0.0.1:8000}"
echo "==> Runtime Console: http://0.0.0.0:3000 (proxy → $API_PROXY_TARGET)"
exec npm run dev
