/**
 * k6 — carga leve nos endpoints Stripe
 * Uso: k6 run -e API_URL=http://127.0.0.1:8000 -e JUDGE_USER_ID=test-user scripts/load-test-stripe.js
 */
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 5 },
    { duration: "1m", target: 5 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<800"],
    http_req_failed: ["rate<0.05"],
  },
};

const API = __ENV.API_URL || "http://127.0.0.1:8000";
const USER = __ENV.JUDGE_USER_ID || "load-test-user";
const HEADERS = {
  "Content-Type": "application/json",
  "X-Judge-User-Id": USER,
};

export default function () {
  const checkoutRes = http.post(
    `${API}/runtime/judge/stripe/checkout`,
    JSON.stringify({
      price_id: "monthly_spike",
      tier: "spike",
      success_url: "http://localhost:3000/payment/success",
      cancel_url: "http://localhost:3000/pricing",
    }),
    { headers: HEADERS },
  );

  check(checkoutRes, {
    "checkout não é 5xx": (r) => r.status < 500,
  });

  sleep(1);

  const subRes = http.get(`${API}/runtime/judge/stripe/subscription`, { headers: HEADERS });

  check(subRes, {
    "subscription 200 ou 401": (r) => r.status === 200 || r.status === 401,
  });

  sleep(1);
}
