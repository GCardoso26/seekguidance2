#!/usr/bin/env bash
# Smoke test de produção — Judge-TCG
set -euo pipefail

BASE="${BASE:-https://judgetcg.com.br}"
API="${API:-https://seekguidance.onrender.com}"

pass=0
fail=0

check() {
  local label="$1"
  shift
  printf "%-22s " "$label"
  if "$@"; then
    echo "OK"
    pass=$((pass + 1))
  else
    echo "FAIL"
    fail=$((fail + 1))
  fi
}

echo "=== SMOKE TEST PRODUÇÃO ==="
echo "Frontend: $BASE"
echo "API:      $API"
echo

check "1. Frontend" \
  curl -sf -o /dev/null -w "%{http_code}" "$BASE/" | grep -qE '200|307'

check "2. API Health" \
  curl -sf "$API/runtime/judge/health" | grep -qi 'healthy\|ok'

check "3. Catalog" \
  curl -sf "$API/runtime/judge/catalog/health" | grep -qi 'ready\|ok\|healthy'

check "4. Search BFF" \
  curl -sf "$BASE/api/catalog/cards/search?q=lightning&game=MTG" | grep -q 'cards'

check "5. API /health BFF" \
  curl -sf "$BASE/api/health" | grep -q 'ok'

check "6. Liga Pass (anon)" \
  curl -sf "$API/runtime/judge/gamification/xp/me" \
    -H "X-Judge-User-Id: smoke-test-user" | grep -q 'total_xp'

echo
echo "=== RESULTADO: $pass OK, $fail FAIL ==="
[ "$fail" -eq 0 ]
