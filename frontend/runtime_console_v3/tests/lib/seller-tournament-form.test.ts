import { describe, expect, it } from "vitest";
import { parseSellerTournamentForm, tournamentFormToApiPayload } from "@/lib/seller-tournament-form";

describe("seller-tournament-form", () => {
  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

  it("aceita torneio válido com data futura", () => {
    const result = parseSellerTournamentForm({
      name: "FNM Standard",
      pairing_format: "swiss",
      game_id: "MTG",
      format_code: "STANDARD",
      date: futureDate,
      entry_fee: 25,
      max_players: 32,
      description: "Torneio semanal",
      prizes: "Boosters",
      location: "Online",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const payload = tournamentFormToApiPayload(result.data);
      expect(payload.name).toBe("FNM Standard");
      expect(payload.game_code).toBe("MTG");
      expect(payload.format_code).toBe("STANDARD");
      expect(payload.max_players).toBe(32);
    }
  });

  it("rejeita data no passado", () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
    const result = parseSellerTournamentForm({
      name: "Torneio antigo",
      pairing_format: "swiss",
      game_id: "MTG",
      format_code: "STANDARD",
      date: past,
      entry_fee: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejeita taxa de inscrição negativa", () => {
    const result = parseSellerTournamentForm({
      name: "Torneio inválido",
      pairing_format: "single_elimination",
      game_id: "POKEMON",
      format_code: "STANDARD",
      date: futureDate,
      entry_fee: -10,
    });
    expect(result.success).toBe(false);
  });
});
