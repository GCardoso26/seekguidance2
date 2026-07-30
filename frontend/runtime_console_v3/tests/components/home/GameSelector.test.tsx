/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { GameSelector } from "@/components/home/GameSelector";
import type { GameInfo } from "@/lib/catalog-games";

const GAMES: GameInfo[] = [
  {
    id: "MTG",
    name: "Magic: The Gathering",
    logoUrl: "/logos/mtg.svg",
    cardCount: 34717,
    primaryColor: "#C41E3A",
    isAvailable: true,
  },
  {
    id: "POKEMON",
    name: "Pokémon TCG",
    logoUrl: "/logos/pokemon.svg",
    cardCount: 0,
    primaryColor: "#FFCB05",
    isAvailable: false,
  },
];

describe("GameSelector", () => {
  afterEach(() => {
    cleanup();
  });

  it("renderiza jogos com contagem e badge em breve", () => {
    render(<GameSelector games={GAMES} onSelect={vi.fn()} />);
    expect(screen.getByRole("radiogroup", { name: /Todos os jogos no mercado/i })).toBeTruthy();
    expect(screen.getByText(/35k cartas/i)).toBeTruthy();
    expect(screen.getByText("Em breve")).toBeTruthy();
    expect(screen.getByText("Catálogo em ingestão")).toBeTruthy();
  });

  it("chama onSelect ao clicar em jogo disponível", () => {
    const onSelect = vi.fn();
    render(<GameSelector games={GAMES} onSelect={onSelect} selectedGame="MTG" />);
    fireEvent.click(screen.getByRole("radio", { name: /Magic/i }));
    expect(onSelect).toHaveBeenCalledWith("MTG");
  });

  it("não chama onSelect em jogo indisponível", () => {
    const onSelect = vi.fn();
    render(<GameSelector games={GAMES} onSelect={onSelect} />);
    const disabled = screen.getByRole("radio", { name: /Pokémon/i });
    expect(disabled.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(disabled);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("marca jogo selecionado com aria-checked", () => {
    render(<GameSelector games={GAMES} onSelect={vi.fn()} selectedGame="MTG" />);
    expect(screen.getByRole("radio", { name: /Magic/i }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("radio", { name: /Pokémon/i }).getAttribute("aria-checked")).toBe("false");
  });

  it("seleciona com Enter no teclado", () => {
    const onSelect = vi.fn();
    render(<GameSelector games={GAMES} onSelect={onSelect} selectedGame="MTG" />);
    const mtg = screen.getByRole("radio", { name: /Magic/i });
    fireEvent.keyDown(mtg, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith("MTG");
  });
});
