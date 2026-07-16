import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CatalogBlock } from "@/src/components/buyer/CatalogBlock";
import { OffersBlock } from "@/src/components/buyer/OffersBlock";
import { SearchResultItem } from "@/src/components/buyer/SearchResultList";
import type { CardDetails } from "@/src/types/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const card: CardDetails = {
  id: "card_123",
  name: "Lightning Bolt",
  setCode: "LEA",
  setName: "Limited Edition Alpha",
  language: "en",
  rarity: "Common",
  imageUrl: null,
  priceMin: null,
  currency: null,
  hasStock: false,
  oracleText: "Lightning Bolt deals 3 damage to any target.",
  finishes: ["nonfoil"],
  storeIds: [],
  stockTotal: 0,
  priceMax: null,
  updatedAt: new Date().toISOString(),
  projection: "search",
};

function wrap(ui: ReactNode) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("buyer UI states", () => {
  it("search result shows catalog fields only (no seller/price)", () => {
    render(
      <SearchResultItem
        card={{
          id: "card_123",
          name: "Lightning Bolt",
          setCode: "LEA",
          setName: "Alpha",
          language: "en",
          rarity: "Common",
          imageUrl: null,
          priceMin: 1990,
          currency: "BRL",
          hasStock: true,
        }}
      />,
    );
    expect(screen.getByText("Lightning Bolt")).toBeInTheDocument();
    expect(screen.getByText(/Alpha/)).toBeInTheDocument();
    expect(screen.getByText("Common")).toBeInTheDocument();
    expect(screen.queryByText(/R\$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/seller/i)).not.toBeInTheDocument();
  });

  it("CatalogBlock não inclui dados de oferta", () => {
    render(<CatalogBlock card={card} />);
    const block = screen.getByTestId("catalog-block");
    expect(block).toHaveTextContent("Catalog");
    expect(block).toHaveTextContent("Lightning Bolt");
    expect(block).toHaveTextContent("Oracle");
    expect(block).not.toHaveTextContent("Ofertas");
    expect(block).not.toHaveTextContent("Loja");
    expect(block).not.toHaveTextContent("R$");
  });

  it("OffersBlock empty / error / loading", () => {
    const { rerender } = wrap(
      <OffersBlock cardId="card_123" cardName="Lightning Bolt" status="pending" />,
    );
    expect(screen.getByText(/Carregando ofertas/)).toBeInTheDocument();

    rerender(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <OffersBlock cardId="card_123" cardName="Lightning Bolt" status="error" />
      </QueryClientProvider>,
    );
    expect(
      screen.getByText(/Ofertas indisponíveis temporariamente/),
    ).toBeInTheDocument();
    expect(screen.getByText(/carta foi encontrada/i)).toBeInTheDocument();

    rerender(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <OffersBlock
          cardId="card_123"
          cardName="Lightning Bolt"
          status="success"
          data={{
            catalogCardId: "card_123",
            offerCount: 0,
            bestPriceCents: null,
            currency: "BRL",
            offers: [],
          }}
        />
      </QueryClientProvider>,
    );
    expect(
      screen.getByText(/Nenhuma loja possui esta carta/),
    ).toBeInTheDocument();
  });
});
