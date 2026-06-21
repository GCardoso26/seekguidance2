#!/usr/bin/env bash
# deploy.sh — Judge TCG Marketplace v1.0
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "🚀 Deploy Judge TCG v1.0"

echo "📋 1/5 — Testes unitários marketplace..."
cd services/api
python -m pytest tests/marketplace/test_pix_coupon.py -q

echo "📋 2/5 — Migrations Supabase..."
cd "$ROOT"
if command -v supabase >/dev/null 2>&1; then
  supabase db push --include-all || echo "⚠️  supabase db push falhou — aplicar manualmente"
else
  echo "⚠️  Supabase CLI não encontrado — pular migrations"
fi

echo "📋 3/5 — Commit e push..."
git add -A
if git diff --cached --quiet; then
  echo "ℹ️  Nenhuma alteração para commit"
else
  git commit -m "release: v1.0 marketplace neutro — PIX, Pro, cupons, FCM, health"
  git push origin main
fi

echo "📋 4/5 — Aguardando deploy (60s)..."
sleep 60

echo "📋 5/5 — Smoke tests produção..."
cd services/api
PRODUCTION_API_URL="${PRODUCTION_API_URL:-https://api.judgetcg.com.br}" \
PRODUCTION_FRONTEND_URL="${PRODUCTION_FRONTEND_URL:-https://judgetcg.com.br}" \
python -m pytest tests/smoke/test_production.py -v || echo "⚠️  Smoke tests falharam — verificar manualmente"

echo ""
echo "✅ Pipeline de deploy concluído!"
echo "🌐 https://judgetcg.com.br"
echo "🔍 Health: https://api.judgetcg.com.br/v1/health"
