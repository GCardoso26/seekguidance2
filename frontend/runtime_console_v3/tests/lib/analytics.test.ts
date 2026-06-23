import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  __readAnalyticsQueueForTests,
  __resetAnalyticsForTests,
  flushAnalytics,
  trackEvent,
} from "@/lib/analytics";

const store: Record<string, string> = {};

function mockBrowser() {
  vi.stubGlobal("window", {
    location: { href: "https://judgetcg.com.br/test" },
  });
  vi.stubGlobal("document", { referrer: "" });
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
  });
  vi.stubGlobal("sessionStorage", {
    getItem: (k: string) => store[`session:${k}`] ?? null,
    setItem: (k: string, v: string) => {
      store[`session:${k}`] = v;
    },
    removeItem: (k: string) => {
      delete store[`session:${k}`];
    },
  });
  vi.stubGlobal("crypto", { randomUUID: () => "anon-test-id" });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
}

describe("analytics", () => {
  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k]);
    mockBrowser();
    __resetAnalyticsForTests();
  });

  it("enfileira evento com anonymous_id", async () => {
    await trackEvent("pricing_page_view", { source: "direct" });
    const queue = __readAnalyticsQueueForTests();
    expect(queue).toHaveLength(1);
    expect(queue[0]?.event).toBe("pricing_page_view");
    expect(queue[0]?.anonymous_id).toBe("anon-test-id");
    expect(queue[0]?.properties).toEqual(
      expect.objectContaining({ source: "direct" }),
    );
  });

  it("flush envia fila para /api/analytics/track", async () => {
    await trackEvent("pricing_toggle", { isAnnual: true });
    await flushAnalytics();
    expect(fetch).toHaveBeenCalledWith(
      "/api/analytics/track",
      expect.objectContaining({ method: "POST" }),
    );
    expect(__readAnalyticsQueueForTests()).toHaveLength(0);
  });

  it("flush imediato em paywall_hit", async () => {
    await trackEvent("paywall_hit", { reason: "daily_limit" });
    expect(fetch).toHaveBeenCalled();
  });
});
