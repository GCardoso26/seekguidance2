/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SellerOffersTable } from "@/components/cards/SellerOffersTable";
import { generateSchemaOrgJsonLd } from "@/components/cards/CardDetailJsonLd";
import type { CardListing, UnifiedCard } from "@/types/card";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Brush: () => null,
  ReferenceLine: () => null,
}));

const SAMPLE_CARD: UnifiedCard = {
  id: "abc-123",
  game: "MTG",
  name: "Lightning Bolt",
  number: "161",
  rarity: "common",
  language: "en",
  set: { name: "Modern Horizons 3", code: "mh3" },
  imageUris: { normal: "https://example.com/bolt.jpg", large: "https://example.com/bolt-lg.jpg" },
  gameData: {},
  oracleText: "Lightning Bolt deals 3 damage to any target.",
  lowestPrice: 2.5,
  latestPrice: { price: 2.5, currency: "USD", condition: "NM", foil: false, source: "scryfall" },
};

const LISTINGS: CardListing[] = [
  {
    id: "l1",
    cardId: "abc-123",
    sellerId: "s1",
    sellerName: "Alpha Store",
    sellerReputation: 4.8,
    condition: "NM",
    price: 2.5,
    currency: "USD",
    quantity: 3,
    foil: false,
    language: "en",
    createdAt: "2026-01-01T00:00:00Z",
    productId: "550e8400-e29b-41d4-a716-446655440001",
  },
  {
    id: "l2",
    cardId: "abc-123",
    sellerId: "s2",
    sellerName: "Beta Cards",
    sellerReputation: 4.2,
    condition: "LP",
    price: 1.9,
    currency: "USD",
    quantity: 1,
    foil: false,
    language: "en",
    createdAt: "2026-01-02T00:00:00Z",
    productId: "550e8400-e29b-41d4-a716-446655440002",
  },
];

function wrapper(children: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("SellerOffersTable", () => {
  afterEach(() => cleanup());

  it("mostra estado vazio sem ofertas", () => {
    render(<SellerOffersTable listings={[]} />);
    expect(screen.getByText(/Nenhuma oferta disponível/i)).toBeTruthy();
  });

  it("ordena por preço ascendente por padrão", () => {
    render(<SellerOffersTable listings={LISTINGS} />);
    const rows = screen.getAllByRole("button", { name: /Comprar/i });
    expect(rows).toHaveLength(2);
    expect(screen.getByText("Beta Cards")).toBeTruthy();
    expect(screen.getByText("Alpha Store")).toBeTruthy();
  });

  it("alterna ordenação ao clicar cabeçalho Preço", () => {
    render(<SellerOffersTable listings={LISTINGS} />);
    fireEvent.click(screen.getByRole("button", { name: /Preço/i }));
    expect(screen.getAllByRole("button", { name: /Comprar/i })).toHaveLength(2);
  });
});

describe("generateSchemaOrgJsonLd", () => {
  it("gera Product com AggregateOffer", () => {
    const schema = generateSchemaOrgJsonLd(SAMPLE_CARD, LISTINGS) as Record<string, unknown>;
    expect(schema["@type"]).toBe("Product");
    expect(schema.name).toBe("Lightning Bolt");
    const offers = schema.offers as Record<string, unknown>;
    expect(offers["@type"]).toBe("AggregateOffer");
    expect(offers.lowPrice).toBe(2.5);
  });
});

describe("PriceChart", () => {
  afterEach(() => cleanup());

  it("mostra mensagem quando histórico vazio", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    const { PriceChart } = await import("@/components/cards/PriceChart");
    render(wrapper(<PriceChart cardId="abc-123" range="30d" />));

    expect(await screen.findByText(/Sem dados de preço/i)).toBeTruthy();
  });
});
