#!/usr/bin/env node
/**
 * Testa conectividade do endpoint de webhook (sem validar assinatura real).
 * Uso: WEBHOOK_URL=https://... node scripts/test-webhooks.js
 */
const DEFAULT_URL =
  process.env.WEBHOOK_URL ||
  "http://127.0.0.1:8000/runtime/judge/stripe/webhook";

const EVENT_TYPES = [
  "checkout.session.completed",
  "invoice.paid",
  "invoice.payment_failed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
];

async function main() {
  console.log("🎴 Judge TCG — Webhook smoke (HTTP)");
  console.log("URL:", DEFAULT_URL);
  console.log("");

  for (const type of EVENT_TYPES) {
    const payload = JSON.stringify({
      id: `evt_smoke_${type}`,
      type,
      data: { object: { id: "obj_smoke", metadata: { user_id: "smoke-user" } } },
    });
    try {
      const res = await fetch(DEFAULT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Stripe-Signature": "smoke_invalid",
        },
        body: payload,
      });
      const label =
        res.status === 400
          ? "✅ rejeitou assinatura inválida (esperado sem CLI)"
          : `⚠️  status ${res.status}`;
      console.log(`${type}: ${label}`);
    } catch (err) {
      console.log(`${type}: ❌ ${err.message}`);
    }
  }

  console.log("");
  console.log("Para testes reais com assinatura válida, usa: npm run test:webhooks (em scripts/)");
}

main();
