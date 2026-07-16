import { describe, expect, it } from "vitest";
import { runProductionReadinessSmoke } from "../goldenPath/runProductionReadinessSmoke.js";
import { metrics } from "../../platform/metrics/registry.js";
import { evaluateReadiness, inMemoryHealthDeps } from "../../observability/http/health.js";

describe("Sprint 6 — production readiness + health", () => {
  it("smoke:production-readiness passes end-to-end", async () => {
    const report = await runProductionReadinessSmoke();
    expect(report.ok, report.steps.filter((s) => !s.ok).map((s) => s.name).join(",")).toBe(
      true,
    );
  });

  it("MetricsRegistry emits Prometheus text", () => {
    metrics.reset();
    metrics.inc("checkout_started_total");
    const text = metrics.toPrometheusText();
    expect(text).toContain("checkout_started_total");
    expect(text).toContain("# TYPE");
  });

  it("readiness fails when outbox probe fails", async () => {
    const { ready, checks } = await evaluateReadiness({
      ...inMemoryHealthDeps(),
      checkOutbox: async () => ({ name: "outbox", ok: false, detail: "unreachable" }),
    });
    expect(ready).toBe(false);
    expect(checks.some((c) => c.name === "outbox" && !c.ok)).toBe(true);
  });
});
