import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

const errorRate = new Rate("errors");

export const options = {
  vus: 5,
  duration: __ENV.DURATION || "1m",
  thresholds: {
    http_req_duration: ["p(95)<3000"],
    http_req_failed: ["rate<0.1"],
    errors: ["rate<0.1"],
  },
};

const BASE_URL = __ENV.BASE_URL || "https://judgetcg.com.br";

function hasCards(body) {
  try {
    const parsed = JSON.parse(body);
    return Array.isArray(parsed.cards);
  } catch {
    return false;
  }
}

export default function () {
  const res = http.get(`${BASE_URL}/api/catalog/cards/search?game=mtg&page=1&limit=10`);

  check(res, {
    "status 200": (r) => r.status === 200,
    "has cards array": (r) => hasCards(r.body),
    "latency < 3s": (r) => r.timings.duration < 3000,
  });

  errorRate.add(res.status !== 200);
  sleep(1);
}

export function handleSummary(data) {
  return {
    "k6/summary-smoke.json": JSON.stringify(data, null, 2),
    stdout: `Smoke test — ${BASE_URL}\nRequests: ${data.metrics.http_reqs?.values.count ?? 0}\np95: ${data.metrics.http_req_duration?.values["p(95)"]?.toFixed(0) ?? "N/A"}ms\n`,
  };
}
