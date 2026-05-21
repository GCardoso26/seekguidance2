#!/usr/bin/env bash
# Build Next.js (standalone) e arranca em 127.0.0.1:3000 para o Caddy.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
APP_DIR="${REPO_ROOT}/frontend/runtime_console_v3"
DOMAIN="${JUDGETCG_DOMAIN:-judgetcg.com.br}"
PORT="${CONSOLE_PORT:-3000}"
BIND="${CONSOLE_BIND:-127.0.0.1}"

cd "$APP_DIR"

export API_PROXY_TARGET="${API_PROXY_TARGET:-http://127.0.0.1:8000}"
export NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-https://${DOMAIN}}"

if [[ ! -d node_modules ]]; then
  echo "==> npm install"
  npm ci
fi

echo "==> next build (standalone)"
npm run build

STANDALONE="${APP_DIR}/.next/standalone"
if [[ ! -f "${STANDALONE}/server.js" ]]; then
  echo "ERRO: standalone não gerado em ${STANDALONE}"
  exit 1
fi

mkdir -p "${STANDALONE}/.next"
rm -rf "${STANDALONE}/.next/static" "${STANDALONE}/public"
cp -r "${APP_DIR}/.next/static" "${STANDALONE}/.next/static"
cp -r "${APP_DIR}/public" "${STANDALONE}/public"

export PORT="${PORT}"
export HOSTNAME="${BIND}"

echo "==> Next produção: http://${BIND}:${PORT} (público via Caddy → https://${DOMAIN})"
cd "${STANDALONE}"
exec node server.js
