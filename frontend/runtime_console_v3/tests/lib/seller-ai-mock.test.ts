import { describe, expect, it } from "vitest";
import { sellerAiBriefMock, sellerAiInsightsMock } from "@/lib/seller-ai-mock";

describe("sellerAiMock", () => {
  it("brief possui oportunidades e top insights", () => {
    const brief = sellerAiBriefMock();
    expect(brief.opportunity_count).toBeGreaterThan(0);
    expect(brief.top_insights.length).toBe(3);
    expect(brief.summary).toContain("oportunidades");
  });

  it("insights agrupados por prioridade", () => {
    const data = sellerAiInsightsMock();
    expect(data.total).toBe(data.insights.length);
    expect(data.grouped.high.length).toBeGreaterThan(0);
  });
});
