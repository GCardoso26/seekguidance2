/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RankingDisplay } from "@/components/player/RankingDisplay";

describe("RankingDisplay", () => {
  it("mostra tier e pontos", () => {
    render(
      <RankingDisplay
        rankings={[{ game_code: "MTG", format: "STANDARD", points: 1542, tier: "Diamond", division: 2 }]}
      />,
    );
    expect(screen.getByText(/MTG STANDARD/)).toBeTruthy();
    expect(screen.getByText(/Diamond/)).toBeTruthy();
    expect(screen.getByText(/1542 pts/)).toBeTruthy();
  });
});
