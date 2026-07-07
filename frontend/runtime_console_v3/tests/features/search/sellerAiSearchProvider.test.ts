import { describe, expect, it } from "vitest";
import { sellerAiSearchProvider } from "@/features/search/providers/sellerAiSearchProvider";

describe("sellerAiSearchProvider", () => {
  it("encontra produtos sem estoque", async () => {
    const results = await sellerAiSearchProvider.search(
      "sem estoque",
      {
        surface: "seller",
        pathname: "/vendedor/painel",
        isAuthenticated: true,
        isSeller: true,
        isAdmin: false,
        isJudge: false,
      },
      new AbortController().signal,
    );
    expect(results.some((r) => r.title.includes("estoque"))).toBe(true);
  });

  it("desabilitado fora do painel seller", () => {
    expect(
      sellerAiSearchProvider.enabled({
        surface: "marketplace",
        pathname: "/loja",
        isAuthenticated: false,
        isSeller: false,
        isAdmin: false,
        isJudge: false,
      }),
    ).toBe(false);
  });
});
