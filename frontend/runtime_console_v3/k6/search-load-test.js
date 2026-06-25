import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend } from "k6/metrics";

const errorRate = new Rate("errors");
const apiLatency = new Trend("api_latency");
const renderLatency = new Trend("render_proxy_latency");

const scenario = (__ENV.SCENARIO || "all").toLowerCase();

const allScenarios = {
  normal_load: {
    executor: "constant-vus",
    vus: 10,
    duration: "5m",
    startTime: "0s",
  },
  spike_load: {
    executor: "ramping-vus",
    startVUs: 0,
    stages: [
      { duration: "2m", target: 50 },
      { duration: "5m", target: 50 },
      { duration: "2m", target: 100 },
      { duration: "5m", target: 100 },
      { duration: "2m", target: 0 },
    ],
    startTime: "6m",
  },
  stress_test: {
    executor: "ramping-vus",
    startVUs: 0,
    stages: [
      { duration: "5m", target: 200 },
      { duration: "10m", target: 200 },
      { duration: "5m", target: 400 },
      { duration: "10m", target: 400 },
      { duration: "5m", target: 0 },
    ],
    startTime: "20m",
  },
};

function pickScenarios() {
  if (scenario === "all") return allScenarios;
  if (scenario in allScenarios) {
    const picked = allScenarios[scenario];
    return { [scenario]: { ...picked, startTime: "0s" } };
  }
  return { normal_load: allScenarios.normal_load };
}

export const options = {
  scenarios: pickScenarios(),
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.05"],
    errors: ["rate<0.05"],
    api_latency: ["p(95)<1500"],
    render_proxy_latency: ["p(95)<3000"],
  },
};

const BASE_URL = __ENV.BASE_URL || "https://judgetcg.com.br";
const API_KEY = __ENV.API_KEY || "";

function hasCards(body) {
  try {
    const parsed = JSON.parse(body);
    return Array.isArray(parsed.cards) && parsed.cards.length > 0;
  } catch {
    return false;
  }
}

export default function () {
  const params = {
    headers: {
      "Content-Type": "application/json",
      ...(API_KEY && { "X-API-Key": API_KEY }),
    },
  };

  group("Search MTG Cards", () => {
    const res1 = http.get(
      `${BASE_URL}/api/catalog/cards/search?game=mtg&page=1&limit=20`,
      params,
    );

    check(res1, {
      "search status is 200": (r) => r.status === 200,
      "search response time < 2s": (r) => r.timings.duration < 2000,
      "search has cards": (r) => hasCards(r.body),
    });

    apiLatency.add(res1.timings.duration);
    errorRate.add(res1.status !== 200);

    const renderTime = res1.headers["X-Render-Proxy-Time"];
    if (renderTime) {
      renderLatency.add(parseInt(renderTime, 10));
    }

    sleep(1);
  });

  group("Search with Query", () => {
    const queries = ["lightning bolt", "black lotus", "counterspell", "fetch land", "planeswalker"];
    const query = queries[Math.floor(Math.random() * queries.length)];

    const res2 = http.get(
      `${BASE_URL}/api/catalog/cards/search?game=mtg&q=${encodeURIComponent(query)}&page=1&limit=20`,
      params,
    );

    check(res2, {
      "query search status is 200": (r) => r.status === 200,
      "query search response time < 3s": (r) => r.timings.duration < 3000,
    });

    apiLatency.add(res2.timings.duration);
    errorRate.add(res2.status !== 200);

    sleep(2);
  });

  group("Search with Filters", () => {
    const res3 = http.get(
      `${BASE_URL}/api/catalog/cards/search?game=mtg&set=lea&rarity=rare&page=1&limit=20`,
      params,
    );

    check(res3, {
      "filtered search status is 200": (r) => r.status === 200,
      "filtered search response time < 3s": (r) => r.timings.duration < 3000,
    });

    apiLatency.add(res3.timings.duration);
    errorRate.add(res3.status !== 200);

    sleep(3);
  });
}

export function handleSummary(data) {
  return {
    "k6/summary-search.json": JSON.stringify(data, null, 2),
    stdout: `
╔══════════════════════════════════════════════════════════════╗
║           JUDGE TCG — LOAD TEST RESULTS                      ║
╠══════════════════════════════════════════════════════════════╣
  Endpoint: /api/catalog/cards/search
  Base URL: ${BASE_URL}
  Scenario: ${scenario}

  Requests: ${data.metrics.http_reqs?.values.count ?? 0}
  Failed:   ${((data.metrics.http_req_failed?.values.rate ?? 0) * 100).toFixed(2)}%

  Latency (ms):
    p50:  ${data.metrics.http_req_duration?.values["p(50)"]?.toFixed(0) ?? "N/A"}
    p95:  ${data.metrics.http_req_duration?.values["p(95)"]?.toFixed(0) ?? "N/A"}
    p99:  ${data.metrics.http_req_duration?.values["p(99)"]?.toFixed(0) ?? "N/A"}
    avg:  ${data.metrics.http_req_duration?.values.avg?.toFixed(0) ?? "N/A"}

  API Latency:
    p95:  ${data.metrics.api_latency?.values["p(95)"]?.toFixed(0) ?? "N/A"}

  Render Proxy Latency:
    p95:  ${data.metrics.render_proxy_latency?.values["p(95)"]?.toFixed(0) ?? "N/A"}
╚══════════════════════════════════════════════════════════════╝
    `,
  };
}
