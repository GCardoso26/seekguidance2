import { describe, expect, it } from "vitest";
import { RulingSearch } from "@/lib/rulings/RulingSearch";
import { RulingManager } from "@/lib/rulings/RulingManager";
import { lorcanaRulings } from "@/lib/rulings/seeds/lorcana";

describe("RulingSearch", () => {
  const search = new RulingSearch();

  it("busca bodyguard por keyword", () => {
    const results = search.findByKeywords(["bodyguard"], "lorcana");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.title).toContain("Bodyguard");
  });

  it("busca por texto livre", () => {
    const results = search.search("evasive", { tcg: "lorcana" });
    expect(results.length).toBeGreaterThan(0);
  });

  it("lista corpus quando a query está vazia", () => {
    const results = search.search("", { tcg: "lorcana", limit: 20 });
    expect(results.length).toBeGreaterThan(0);
  });
});

describe("RulingManager workflow", () => {
  it("create → verify → deprecate", () => {
    const manager = new RulingManager();
    const created = manager.create({
      ...lorcanaRulings[0],
      version: "test",
      effective_from: "2026-06-01",
    });
    const verified = manager.verify(created.id, "judge-1");
    expect(verified.hierarchy).toBe("community_verified");
    const deprecated = manager.deprecate(created.id);
    expect(deprecated.status).toBe("deprecated");
  });
});
