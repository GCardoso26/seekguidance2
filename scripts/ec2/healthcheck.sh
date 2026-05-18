#!/usr/bin/env bash
set -euo pipefail

BASE="${API_BASE_URL:-http://127.0.0.1:8000}"

check() {
  local path="$1"
  local required="${2:-1}"
  echo -n "GET $path ... "
  local code
  code="$(curl -s -o /tmp/hc_body.json -w "%{http_code}" "$BASE$path" || true)"
  if [[ "$code" == "200" ]]; then
    echo "OK ($code)"
    return 0
  fi
  echo "FAIL ($code)"
  head -c 200 /tmp/hc_body.json 2>/dev/null || true
  echo
  if [[ "$required" == "1" ]]; then
    return 1
  fi
  return 0
}

fail=0
# Obrigatório (API core)
check "/v1/health" 1 || fail=1
# Runtime pilot (após imagem production com routers novos)
check "/health" 0 || true
check "/runtime/health" 0 || true

if [[ "$fail" -ne 0 ]]; then
  echo "Healthcheck falhou. Logs: docker logs tcg-judge-api --tail 80"
  exit 1
fi
echo "Healthcheck OK (v1/health; rotas /health e /runtime/health opcionais até rebuild)"
