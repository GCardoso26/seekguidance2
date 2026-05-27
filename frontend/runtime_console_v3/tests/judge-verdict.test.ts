import { describe, it, expect } from "vitest";
import { parseJudgeVerdict, extractHighlightTerms } from "@/lib/judge-verdict";
import { parseJudgeSearchParams, isValidTcgType } from "@/lib/judge-url";
import type { JudgeResponse } from "@/types/judge";

describe("judge verdict parser", () => {
  it("uses structured API fields", () => {
    const response: JudgeResponse = {
      success: true,
      answer: "fallback",
      confidence: 0.9,
      sources: [],
      runtime_confidence: 0.94,
      verdict: "Permitido",
      rule_applied: "CR 702.19",
      explanation: "Trample atribui dano excedente.",
      exceptions: null,
    };
    const parsed = parseJudgeVerdict(response);
    expect(parsed.kind).toBe("permitido");
    expect(parsed.ruleApplied).toBe("CR 702.19");
    expect(parsed.explanation).toContain("Trample");
  });

  it("extracts highlight terms from rules", () => {
    const terms = extractHighlightTerms("CR 702.19", "Ver regra 702.19a sobre trample.");
    expect(terms.some((t) => t.includes("702.19"))).toBe(true);
  });
});

describe("judge url helpers", () => {
  it("validates tcg slug", () => {
    expect(isValidTcgType("magic")).toBe(true);
    expect(isValidTcgType("invalid")).toBe(false);
  });

  it("parses deep link params", () => {
    const params = new URLSearchParams("game=flesh_and_blood&q=go+again");
    const parsed = parseJudgeSearchParams(params);
    expect(parsed.tcg).toBe("flesh_and_blood");
    expect(parsed.question).toBe("go again");
  });
});
