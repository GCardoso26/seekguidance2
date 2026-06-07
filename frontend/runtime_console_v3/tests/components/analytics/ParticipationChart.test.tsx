/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ParticipationChart } from "@/components/analytics/ParticipationChart";

describe("ParticipationChart", () => {
  it("renderiza breakdown por jogo", () => {
    render(
      <ParticipationChart
        breakdown={[
          { game_code: "MTG", tournaments: 10, participants: 380 },
          { game_code: "POKEMON", tournaments: 8, participants: 271 },
        ]}
      />,
    );
    expect(screen.getByText("MTG")).toBeTruthy();
    expect(screen.getByText("POKEMON")).toBeTruthy();
  });
});
