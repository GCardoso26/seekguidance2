import { describe, expect, it } from "vitest";
import { benchmarkScore, CATALOG_BENCHMARK } from "@/lib/catalog-benchmark";

describe("catalog benchmark", () => {
  it("tem todas as dimensões preenchidas", () => {
    expect(Object.keys(CATALOG_BENCHMARK).length).toBeGreaterThanOrEqual(6);
  });

  it("não reporta behind no baseline Sprint 13", () => {
    const score = benchmarkScore();
    expect(score.behind).toBe(0);
    expect(score.ahead).toBeGreaterThan(0);
  });
});
