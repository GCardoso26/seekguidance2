#!/usr/bin/env bash
# Smoke test de produção — Judge-TCG (alternativa leve)
set -euo pipefail

FRONTEND="${SMOKE_FRONTEND_URL:-https://judgetcg.com.br}"
API="${SMOKE_API_URL:-https://seekguidance.onrender.com}"
FAILED=0
TOTAL=10

echo "=== JUDGE-TCG SMOKE TEST ==="
echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "Frontend: $FRONTEND"
echo "API:      $API"
echo ""

check() {
  local name=$1
  local url=$2
  local expected_status=${3:-200}
  local expected_body=${4:-""}

  echo -n "  Testing $name... "

  STATUS=$(curl -s -o /tmp/smoke_response -w "%{http_code}" --max-time 10 "$url" || echo "000")

  if [ "$STATUS" != "$expected_status" ]; then
    echo "FAIL (status $STATUS, expected $expected_status)"
    FAILED=$((FAILED + 1))
    return 0
  fi

  if [ -n "$expected_body" ] && ! grep -qi "$expected_body" /tmp/smoke_response; then
    echo "FAIL (body missing '$expected_body')"
    FAILED=$((FAILED + 1))
    return 0
  fi

  echo "OK"
}

check "API Health" "$API/runtime/judge/health" 200 "ok"
check "Catalog Health" "$API/runtime/judge/catalog/health" 200 "status"
check "BFF Health" "$FRONTEND/api/health" 200 "ok"
check "Frontend Home" "$FRONTEND/" 200 "Judge TCG"
check "Search Page" "$FRONTEND/catalog/search?q=lightning" 200 "catalog/search"
check "BFF Search" "$FRONTEND/api/catalog/cards/search?q=bolas&game=MTG" 200 "cards"
check "Leaderboard" "$FRONTEND/leaderboard" 200 "leaderboard"
check "Checkout" "$FRONTEND/marketplace/checkout" 200 "marketplace/checkout"
check "Gamification Auth" "$API/runtime/judge/gamification/xp/me" 401 ""
check "Admin Auth" "$API/runtime/judge/admin/analytics/dashboard" 401 ""

echo ""
echo "=== RESULT: $((TOTAL - FAILED))/$TOTAL passed ==="

if [ "$FAILED" -gt 0 ]; then
  echo "SMOKE TEST FAILED"
  exit 1
fi

echo "ALL CHECKS PASSED"
exit 0
