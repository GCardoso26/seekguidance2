import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const API = "http://127.0.0.1:8791";
const listingId = "76ba13ac-6ef5-4ea0-a842-4858cb6c3a6c";

async function buyer(tag) {
  const email = `${tag}_${Date.now()}@judgetcg.com.br`;
  await fetch(`${API}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, displayName: tag, password: "TestPass123!" }),
  });
  const login = await (
    await fetch(`${API}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "TestPass123!" }),
    })
  ).json();
  const token = login.accessToken;
  const cart = await (
    await fetch(`${API}/api/v1/checkout-v2/cart`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: "{}",
    })
  ).json();
  await fetch(`${API}/api/v1/checkout-v2/cart/${cart.id}/items`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ listingId, quantity: 1 }),
  });
  const sessRes = await fetch(`${API}/api/v1/checkout-v2/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `${tag}-${Date.now()}`,
    },
    body: JSON.stringify({ cartId: cart.id, paymentMethod: "card" }),
  });
  const sess = await sessRes.json();
  return { tag, token, sessionId: sess.id, startStatus: sess.status, startHttp: sessRes.status };
}

const b = await buyer("idem10");
const statuses = [];
for (let i = 0; i < 10; i++) {
  const r = await fetch(`${API}/api/v1/checkout-v2/sessions/${b.sessionId}/confirm-payment`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${b.token}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `cx-${i}`,
    },
    body: JSON.stringify({ simulateSuccess: true }),
  });
  const j = await r.json();
  statuses.push({
    http: r.status,
    status: j.status || j.session?.status,
    error: j.error ?? null,
  });
}

const out = {
  at: new Date().toISOString(),
  sessionId: b.sessionId,
  startHttp: b.startHttp,
  startStatus: b.startStatus,
  confirmCalls: 10,
  completedCount: statuses.filter((s) => s.status === "completed").length,
  uniqueStatuses: [...new Set(statuses.map((s) => s.status))],
  statuses,
};
console.log(JSON.stringify(out, null, 2));

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../reports");
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, "checkout-v2-confirm-x10-latest.json"), JSON.stringify(out, null, 2));
