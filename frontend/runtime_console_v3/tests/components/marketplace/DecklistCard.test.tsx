/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DecklistCard } from "@/components/marketplace/DecklistCard";

describe("DecklistCard", () => {
  it("renderiza preço e nome", () => {
    render(
      <DecklistCard id="1" name="Rakdos Aggro" gameCode="MTG" priceCents={1500} sellerName="PlayerOne" rating={4.7} />,
    );
    expect(screen.getByText("Rakdos Aggro")).toBeTruthy();
    expect(screen.getByText("R$ 15,00")).toBeTruthy();
  });
});
