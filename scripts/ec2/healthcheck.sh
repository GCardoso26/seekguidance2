#!/usr/bin/env bash
set -euo pipefail

BASE="${API_BASE_URL:-http://127.0.0.1:8000}"

check() {
  local path="$1"
  local name="$2"
  echo -n "GET $path ... "
  code="$(curl -sf -o /tmp/hc_body.json -w "%{http_code}" "$BASE$path" || echo "000")"
  if [[ "$code" == "200" ]]; then
    echo "OK ($code)"
    return 0
  fi
  echo "FAIL ($code)"
  cat /tmp/hc_body.json 2>/dev/null || true
  return 1
}

fail=0
check "/health" "health" || fail=1
check "/runtime/health" "runtime/health" || fail=1
check "/v1/health" "v1/health" || fail=1

if [[ "$fail" -ne 0 ]]; then
  echo "Healthcheck falhou. Logs: docker logs tcg-judge-api --tail 80"
  exit 1
fi
echo "Todos os healthchecks OK"
