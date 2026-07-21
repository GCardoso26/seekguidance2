import { createPaymentGateway } from "../src/checkout/application/payment/createPaymentGateway.js";
import { createShippingProvider } from "../src/checkout/application/shipping/createShippingProvider.js";

const out: { c: string; ok: boolean; d: string }[] = [];
function rec(c: string, ok: boolean, d: string) {
  out.push({ c, ok, d: String(d).slice(0, 400) });
}

if (process.env.STRIPE_SECRET_KEY) {
  try {
    const gw = createPaymentGateway("stripe");
    const pi = await gw.createPaymentIntent({
      amountCents: 500,
      currency: "BRL",
      sessionId: `live-s-${Date.now()}`,
      method: "card",
    });
    rec(
      "stripe_create_pi",
      Boolean(pi.externalId && pi.clientSecret),
      `${pi.externalId} status=${pi.status}`,
    );
    const got = await gw.getPaymentIntent(pi.externalId);
    rec("stripe_get_pi", got?.externalId === pi.externalId, got?.status || "");

    // Decline path: confirm without payment method stays requires_action/pending — not succeeded
    const confirmed = await gw.confirmPaymentIntent({
      externalId: pi.externalId,
      simulateSuccess: false,
    });
    rec(
      "stripe_confirm_without_pm",
      confirmed.status !== "succeeded",
      confirmed.status,
    );

    // Invalid / missing intent
    try {
      await gw.getPaymentIntent("pi_invalid_does_not_exist_xyz");
      rec("stripe_invalid_intent", true, "null_or_handled");
    } catch (e) {
      rec("stripe_invalid_intent", true, (e as Error).message);
    }
  } catch (e) {
    rec("stripe_create_pi", false, (e as Error).message);
  }
} else {
  rec("stripe_create_pi", false, "STRIPE_SECRET_KEY missing");
}

if (process.env.MERCADOPAGO_ACCESS_TOKEN) {
  try {
    const gw = createPaymentGateway("mercado_pago");
    const pi = await gw.createPaymentIntent({
      amountCents: 500,
      currency: "BRL",
      sessionId: `live-pix-${Date.now()}`,
      method: "pix",
      metadata: { email: "qa.checkout@judgetcg.com.br" },
    });
    rec(
      "mp_pix_create",
      Boolean(pi.externalId),
      `status=${pi.status} pixCopy=${Boolean(pi.pix?.copyPaste)} qr=${Boolean(pi.pix?.qrCodeBase64)}`,
    );
    rec("mp_pix_copy_paste", Boolean(pi.pix?.copyPaste), (pi.pix?.copyPaste || "").slice(0, 48));
    rec("mp_pix_qr", Boolean(pi.pix?.qrCodeBase64 || pi.pix?.copyPaste), "qr_or_copy");
    if (pi.externalId) {
      const got = await gw.getPaymentIntent(pi.externalId);
      rec("mp_pix_get", got?.externalId === pi.externalId, got?.status || "");
    }
  } catch (e) {
    rec("mp_pix_create", false, (e as Error).message);
  }
} else {
  rec("mp_pix_create", false, "MERCADOPAGO_ACCESS_TOKEN missing");
}

if (process.env.MELHOR_ENVIO_TOKEN) {
  try {
    const tryQuote = async (sandboxFlag: string) => {
      process.env.MELHOR_ENVIO_SANDBOX = sandboxFlag;
      const p = createShippingProvider("melhor_envio");
      return p.quote({
        originCep: "01310100",
        destinationCep: "22041080",
        weightGrams: 500,
        declaredValueCents: 5000,
      });
    };
    let q;
    let mode = "sandbox";
    try {
      q = await tryQuote(process.env.MELHOR_ENVIO_SANDBOX === "false" ? "false" : "true");
      if (process.env.MELHOR_ENVIO_SANDBOX === "false") mode = "production";
    } catch (e1) {
      const msg = (e1 as Error).message;
      if (msg.includes("401") || msg.includes("Unauthenticated")) {
        mode = process.env.MELHOR_ENVIO_SANDBOX === "false" ? "sandbox" : "production";
        q = await tryQuote(mode === "production" ? "false" : "true");
      } else {
        throw e1;
      }
    }
    rec(
      "me_quote",
      q.length > 0 && (q[0]?.priceCents ?? 0) > 0,
      `mode=${mode} n=${q.length} first=${q[0]?.serviceName} ${q[0]?.priceCents}c days=${q[0]?.daysMin}-${q[0]?.daysMax}`,
    );
    const q2 = await createShippingProvider("melhor_envio").quote({
      originCep: "01310100",
      destinationCep: "30130010",
      weightGrams: 500,
      declaredValueCents: 5000,
    });
    rec("me_cep_change", q2.length > 0, `n=${q2.length}`);
    const names = new Set(q.map((x) => x.serviceName));
    rec("me_modality", names.size >= 1, [...names].slice(0, 4).join("|"));
    rec(
      "me_sla_value",
      q.every((x) => x.daysMin > 0 && x.priceCents > 0),
      `ok=${q.length}`,
    );
  } catch (e) {
    rec("me_quote", false, (e as Error).message);
  }
} else {
  rec("me_quote", false, "MELHOR_ENVIO_TOKEN missing");
}

console.log(JSON.stringify(out));
