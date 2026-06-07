#!/usr/bin/env bash
# Judge TCG — testar webhooks via Stripe CLI (dev local)
set -euo pipefail

echo "🎴 Judge TCG — Webhook Tests (Stripe CLI)"
echo "========================================"

if ! command -v stripe &>/dev/null; then
  echo "❌ Stripe CLI não encontrado: https://stripe.com/docs/stripe-cli"
  exit 1
fi

echo "✅ Stripe CLI encontrado"
echo ""
echo "Certifica-te que o backend está a correr e que fazes forward:"
echo "  stripe listen --forward-to localhost:8000/runtime/judge/stripe/webhook"
echo ""

EVENTS=(
  checkout.session.completed
  invoice.paid
  invoice.payment_failed
  customer.subscription.updated
  customer.subscription.deleted
)

for evt in "${EVENTS[@]}"; do
  echo "→ stripe trigger $evt"
  stripe trigger "$evt" || echo "  ⚠️  Falhou: $evt"
done

echo ""
echo "✅ Eventos disparados. Verifica os logs da API."
