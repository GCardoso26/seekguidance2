/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlayerProfile } from "@/components/player/PlayerProfile";

describe("PlayerProfile", () => {
  it("renderiza handle e estatísticas", () => {
    render(
      <PlayerProfile
        profile={{
          handle: "playerone",
          displayName: "Player One",
          bio: "MTG e Pokémon",
          stats: [
            { tournaments_won: 12, tournaments_played: 47 },
          ],
          rankings: [
            { game_code: "MTG", format: "STANDARD", points: 1542, tier: "Diamond", division: 2 },
          ],
          achievements: [{ name: "Estreia", icon: "🎴", rarity: "common" }],
          recentTournaments: [
            {
              tournament_name: "FNM #45",
              game_code: "MTG",
              placement: 1,
              total_participants: 32,
              points_earned: 200,
            },
          ],
        }}
      />,
    );
    expect(screen.getByText("@playerone")).toBeTruthy();
    expect(screen.getByText("12")).toBeTruthy();
    expect(screen.getByText("FNM #45")).toBeTruthy();
    expect(screen.getByText("Estreia")).toBeTruthy();
  });
});
