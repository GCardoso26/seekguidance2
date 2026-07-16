import { describe, expect, it } from "vitest";
import {
  MARKETPLACE_PERFORMANCE_BUDGET,
  checkBudget,
} from "../performanceBudget.js";
import {
  formatGoldenPathReport,
  runGoldenPathSmoke,
} from "../goldenPath/runGoldenPathSmoke.js";

describe("Sprint 4.4 — performance budget", () => {
  it("defines frozen budgets for the product path", () => {
    expect(MARKETPLACE_PERFORMANCE_BUDGET.loginMs).toBe(150);
    expect(MARKETPLACE_PERFORMANCE_BUDGET.publishListingMs).toBe(250);
    expect(MARKETPLACE_PERFORMANCE_BUDGET.listingToSearchMs).toBe(5_000);
    expect(MARKETPLACE_PERFORMANCE_BUDGET.getSearchMs).toBe(100);
    expect(MARKETPLACE_PERFORMANCE_BUDGET.getOffersMs).toBe(100);
  });

  it("checkBudget flags regressions", () => {
    expect(checkBudget("loginMs", 50).ok).toBe(true);
    expect(checkBudget("loginMs", 200).ok).toBe(false);
    expect(checkBudget("getOffersMs", 99).ok).toBe(true);
  });

  it("golden path smoke passes budgets (CI gate)", async () => {
    const report = await runGoldenPathSmoke();
    // eslint-disable-next-line no-console
    console.log(formatGoldenPathReport(report));
    expect(report.passed).toBe(true);
    expect(report.offerCount).toBe(1);
    expect(report.deadOutbox).toBe(0);
    for (const t of report.timings) {
      expect(t.ok, `${t.name} ${t.ms}ms > ${t.budgetMs}ms`).toBe(true);
    }
  });
});
