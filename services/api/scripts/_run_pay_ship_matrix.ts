import { createPaymentGateway } from "../src/checkout/application/payment/createPaymentGateway.js";
import { createShippingProvider } from "../src/checkout/application/shipping/createShippingProvider.js";

const out: { c: string; ok: boolean; d: string }[] = [];
function rec(c: string, ok: boolean, d: string) {
  out.push({ c, ok, d: String(d).slice(0, 300) });
}

const stub = createPaymentGateway("stub");

{
  const pi = await stub.createPaymentIntent({
    amountCents: 1990,
    currency: "BRL",
    sessionId: "s-ok",
    method: "card",
  });
  const c = await stub.confirmPaymentIntent({
    externalId: pi.externalId,
    simulateSuccess: true,
  });
  rec("stub_payment_approved", c.status === "succeeded", c.status);
}

{
  const pi = await stub.createPaymentIntent({
    amountCents: 500,
    currency: "BRL",
    sessionId: "s-fail",
    method: "card",
  });
  const c = await stub.confirmPaymentIntent({
    externalId: pi.externalId,
    simulateSuccess: false,
  });
  rec("stub_payment_declined", c.status === "failed", c.status);
}

{
  const pi = await stub.createPaymentIntent({
    amountCents: 100,
    currency: "BRL",
    sessionId: "s-inv",
  });
  const c = await stub.confirmPaymentIntent({
    externalId: pi.externalId,
    simulateSuccess: false,
  });
  rec("stub_invalid_card_path", c.status === "failed", "simulateSuccess=false");
}

{
  const pi = await stub.createPaymentIntent({
    amountCents: 3200,
    currency: "BRL",
    sessionId: "s-pix",
    method: "pix",
  });
  rec("stub_pix_qr", Boolean(pi.pix?.qrCodeBase64), "qr");
  rec("stub_pix_copy_paste", Boolean(pi.pix?.copyPaste), (pi.pix?.copyPaste || "").slice(0, 40));
  rec("stub_pix_expires", Boolean(pi.pix?.expiresAt), pi.pix?.expiresAt || "missing");
}

{
  const pi = await stub.createPaymentIntent({
    amountCents: 100,
    currency: "BRL",
    sessionId: "s-wh",
    method: "pix",
  });
  const body = JSON.stringify({
    eventId: "evt_dup",
    externalIntentId: pi.externalId,
    status: "succeeded",
  });
  const a = await stub.parseWebhook!({}, body);
  const b = await stub.parseWebhook!({}, body);
  rec(
    "stub_webhook_duplicate",
    a?.eventId === b?.eventId && a?.eventId === "evt_dup",
    "same eventId",
  );
  const c1 = await stub.confirmPaymentIntent({
    externalId: pi.externalId,
    simulateSuccess: false,
  });
  const c2 = await stub.confirmPaymentIntent({
    externalId: pi.externalId,
    simulateSuccess: false,
  });
  rec(
    "stub_confirm_idempotent_after_wh",
    c1.status === "succeeded" && c2.status === "succeeded",
    c1.externalId === c2.externalId ? "same id" : "diff",
  );
}

{
  const pi = await stub.createPaymentIntent({
    amountCents: 100,
    currency: "BRL",
    sessionId: "s-x10",
  });
  const statuses: string[] = [];
  for (let i = 0; i < 10; i++) {
    statuses.push(
      (
        await stub.confirmPaymentIntent({
          externalId: pi.externalId,
          simulateSuccess: true,
        })
      ).status,
    );
  }
  rec("stub_confirm_x10", statuses.every((s) => s === "succeeded"), statuses.join(","));
}

{
  const pi = await stub.createPaymentIntent({
    amountCents: 900,
    currency: "BRL",
    sessionId: "s-rf",
  });
  await stub.confirmPaymentIntent({ externalId: pi.externalId, simulateSuccess: true });
  const rf = await stub.refundPayment({ externalId: pi.externalId });
  rec("stub_refund", rf.ok === true && Boolean(rf.refundId), rf.refundId || "");
}

{
  const pi = await stub.createPaymentIntent({
    amountCents: 200,
    currency: "BRL",
    sessionId: "s-ooo",
    method: "pix",
  });
  await stub.parseWebhook!(
    {},
    JSON.stringify({
      eventId: "e1",
      externalIntentId: pi.externalId,
      status: "cancelled",
    }),
  );
  await stub.parseWebhook!(
    {},
    JSON.stringify({
      eventId: "e2",
      externalIntentId: pi.externalId,
      status: "succeeded",
    }),
  );
  const after = await stub.getPaymentIntent(pi.externalId);
  rec("stub_webhook_out_of_order", after?.status === "succeeded", after?.status || "");
}

{
  const p = createShippingProvider("stub");
  const q1 = await p.quote({
    originCep: "01310100",
    destinationCep: "22041080",
    weightGrams: 500,
  });
  rec(
    "stub_shipping_quote",
    q1.length >= 2 && (q1[0]?.priceCents ?? 0) > 0,
    `n=${q1.length} price=${q1[0]?.priceCents}`,
  );
  const q2 = await p.quote({
    originCep: "01310100",
    destinationCep: "30130010",
    weightGrams: 500,
  });
  rec("stub_shipping_cep_change", q2.length >= 1, `dest=30130010 n=${q2.length}`);
  const modalities = new Set(q1.map((x) => x.serviceName));
  rec("stub_shipping_modality_swap", modalities.size >= 2, [...modalities].join("|"));
  rec(
    "stub_shipping_sla",
    q1.every((x) => x.daysMin > 0),
    `min=${q1[0]?.daysMin} max=${q1[0]?.daysMax}`,
  );
}

for (const g of ["stripe", "mercado_pago"] as const) {
  try {
    createPaymentGateway(g);
    rec(`live_construct_${g}`, true, "constructed");
  } catch (e) {
    rec(`live_construct_${g}`, false, (e as Error).message);
  }
}
try {
  createShippingProvider("melhor_envio");
  rec("live_construct_melhor_envio", true, "constructed");
} catch (e) {
  rec("live_construct_melhor_envio", false, (e as Error).message);
}

// timeout / PIX expired policy (stub: expire then confirm)
{
  const pi = await stub.createPaymentIntent({
    amountCents: 150,
    currency: "BRL",
    sessionId: "s-exp",
    method: "pix",
    expiresAt: new Date(Date.now() - 60_000).toISOString(),
  });
  rec("stub_pix_expired_metadata", Boolean(pi.pix?.expiresAt), pi.pix?.expiresAt || "");
  await stub.parseWebhook!(
    {},
    JSON.stringify({
      eventId: "late_pay",
      externalIntentId: pi.externalId,
      status: "succeeded",
    }),
  );
  const after = await stub.getPaymentIntent(pi.externalId);
  rec(
    "stub_pix_paid_after_expiry_policy",
    after?.status === "succeeded",
    "stub last-write-wins; saga must ignore non-pending session",
  );
}

console.log(JSON.stringify(out));
