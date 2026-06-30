import { describe, expect, it } from "vitest";
import {
  doubleEliminationStructure,
  eliminationBracketSlots,
  seededRandom,
  swissPairingsByPoints,
  swissRound1Pairings,
} from "@/lib/tournament-bracket";

describe("tournament-bracket", () => {
  it("swiss round 1 embaralha com seed determinístico", () => {
    const ids = ["a", "b", "c", "d", "e"];
    const p1 = swissRound1Pairings(ids, 42);
    const p2 = swissRound1Pairings(ids, 42);
    expect(p1).toEqual(p2);
    expect(p1.filter(([, o]) => o === null)).toHaveLength(1);
  });

  it("swiss round 2+ pareia por pontuação", () => {
    const players = [
      { id: "p1", name: "A", points: 9, opponents: ["p2"] },
      { id: "p2", name: "B", points: 9, opponents: ["p1"] },
      { id: "p3", name: "C", points: 6, opponents: [] },
      { id: "p4", name: "D", points: 3, opponents: [] },
    ];
    const pairings = swissPairingsByPoints(players, 2);
    expect(pairings.length).toBe(2);
    const flat = pairings.flat().filter(Boolean);
    expect(flat).toContain("p1");
    expect(flat).toContain("p3");
  });

  it("elimination gera potência de 2 com byes", () => {
    expect(eliminationBracketSlots(5)).toEqual({
      bracketSize: 8,
      byeCount: 3,
      firstRoundMatches: 4,
    });
    expect(eliminationBracketSlots(8).byeCount).toBe(0);
  });

  it("double elimination estrutura winner/loser/grand finals", () => {
    const slots = doubleEliminationStructure(8);
    expect(slots.some((s) => s.side === "winners")).toBe(true);
    expect(slots.some((s) => s.side === "losers")).toBe(true);
    expect(slots.some((s) => s.side === "grand_finals")).toBe(true);
    expect(seededRandom(1)()).toBeGreaterThanOrEqual(0);
  });
});
