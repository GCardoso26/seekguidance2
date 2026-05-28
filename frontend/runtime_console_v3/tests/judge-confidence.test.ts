import { describe, it, expect } from "vitest";
import {
  confidenceLabel,
  confidenceNoticeThreshold,
  lowConfidenceNoticePt,
} from "@/lib/judge-confidence";

describe("judge-confidence", () => {
  it("uses response threshold when provided", () => {
    expect(confidenceNoticeThreshold("magic", [], 0.4)).toBe(0.4);
  });

  it("uses catalog threshold per tcg", () => {
    expect(
      confidenceNoticeThreshold("magic", [
        {
          tcg_id: "magic",
          game_slug: "mtg",
          display_name: "MTG",
          enabled: true,
          coming_soon: false,
          rag_ready: true,
          chunk_count: 1,
          confidence_notice_threshold: 0.38,
        },
      ]),
    ).toBe(0.38);
  });

  it("shows notice below threshold only", () => {
    expect(lowConfidenceNoticePt(0.5, 0.42)).toBeNull();
    expect(lowConfidenceNoticePt(0.35, 0.42)).toContain("confiança");
  });

  it("labels relative to threshold", () => {
    expect(confidenceLabel(0.7, 0.4)).toBe("Alta");
    expect(confidenceLabel(0.45, 0.4)).toBe("Média");
    expect(confidenceLabel(0.3, 0.4)).toBe("Baixa");
  });
});
