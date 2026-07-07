import { describe, expect, it } from "vitest";
import { navigationSearchProvider } from "@/features/search/providers/navigationSearchProvider";

describe("navigationSearchProvider", () => {
  it("encontra rotas do painel vendedor", async () => {
    const results = await navigationSearchProvider.search("pedidos", {
      surface: "seller",
      pathname: "/vendedor/painel",
      isAuthenticated: true,
      isSeller: true,
      isAdmin: false,
      isJudge: false,
    }, new AbortController().signal);
    expect(results.some((r) => r.href.includes("/pedidos"))).toBe(true);
  });

  it("desabilitado fora do contexto seller para tickets provider", async () => {
    const { ticketSearchProvider } = await import(
      "@/features/search/providers/ticketSearchProvider"
    );
    expect(
      ticketSearchProvider.enabled({
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
