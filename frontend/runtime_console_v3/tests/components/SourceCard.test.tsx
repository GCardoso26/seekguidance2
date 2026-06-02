import { describe, expect, it } from "vitest";
import { formatJudgeSource, sourceTypeBadge } from "@/lib/judge-sources";
import type { JudgeSource } from "@/types/judge";

describe("SourceCard helpers", () => {
  it("renders without rule_atom (backwards compat)", () => {
    const source: JudgeSource = { title: "CR", url: "https://example.com" };
    const f = formatJudgeSource(source, 0);
    expect(f.ruleAtom).toBeNull();
    expect(f.sourceType).toBe("official");
  });

  it("uses rule_atom when present", () => {
    const source: JudgeSource = {
      title: "CR",
      url: "https://example.com",
      rule_atom: "702.9a",
      rule_title: "Flying",
    };
    const f = formatJudgeSource(source, 0);
    expect(f.ruleAtom).toBe("702.9a");
  });

  it("adds page anchor to url", () => {
    const source: JudgeSource = {
      title: "CR",
      url: "https://example.com/rules.pdf",
      page_number: 42,
    };
    const f = formatJudgeSource(source, 0);
    expect(f.url).toBe("https://example.com/rules.pdf#page=42");
  });

  it("badge for each source_type", () => {
    expect(sourceTypeBadge("official").label).toBe("Regra Oficial");
    expect(sourceTypeBadge("faq").label).toBe("FAQ Oficial");
    expect(sourceTypeBadge("errata").label).toBe("Errata");
    expect(sourceTypeBadge("local_document").label).toBe("Documento Local");
  });
});
