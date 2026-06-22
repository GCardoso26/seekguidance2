/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CardCard } from "@/components/cards/CardCard";
import { PriceSparkline } from "@/components/cards/PriceSparkline";
import type { UnifiedCard } from "@/types/card";

vi.mock("next/image", () => ({
  default: (props: { alt: string }) => <img alt={props.alt} />,
}));

const SAMPLE: UnifiedCard = {
  id: "abc-123",
  game: "MTG",
  name: "Lightning Bolt",
  number: "161",
  rarity: "common",
  language: "en",
  set: { name: "Modern Horizons 3", code: "mh3" },
  imageUris: { normal: "https://cards.scryfall.io/normal/front/a/b/test.jpg" },
  gameData: {},
  latestPrice: { price: 2.5, currency: "USD", condition: "NM", foil: false, source: "scryfall" },
  lowestPrice: 2.5,
  priceTrend7d: 5.2,
  listingCount: 1,
};

describe("CardCard", () => {
  afterEach(() => cleanup());

  it("renderiza nome, set e preço formatado", () => {
    render(<CardCard card={SAMPLE} onViewDetail={vi.fn()} />);
    expect(screen.getByRole("article", { name: /Lightning Bolt/i })).toBeTruthy();
    expect(screen.getByText(/Modern Horizons 3/)).toBeTruthy();
    expect(screen.getByText(/2,50|2\.50/)).toBeTruthy();
  });

  it("dispara onViewDetail ao clicar Ver no mobile", () => {
    const onView = vi.fn();
    render(<CardCard card={SAMPLE} onViewDetail={onView} />);
    fireEvent.click(screen.getByRole("button", { name: /Ver detalhes de Lightning Bolt/i }));
    expect(onView).toHaveBeenCalledWith("abc-123");
  });
});

describe("PriceSparkline", () => {
  it("renderiza SVG para tendência positiva", () => {
    const { container } = render(<PriceSparkline trend={10} />);
    expect(container.querySelector("svg")).toBeTruthy();
    expect(container.querySelector("path")?.getAttribute("stroke")).toBe("#22C55E");
  });
});
