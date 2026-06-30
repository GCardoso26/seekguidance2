import type { SellerTournamentRow } from "@/types/seller-tournament";
import { normalizeSellerTournament } from "@/types/seller-tournament";

const BASE = [
  {
    id: "mock-tournament-1",
    name: "FNM JudgeTCG — Standard",
    game_code: "MTG",
    format_code: "STANDARD",
    pairing_format: "swiss",
    status: "registration_open",
    max_players: 32,
    entry_fee_cents: 2000,
    starts_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    description: "Torneio semanal na loja.",
    prizes: "Boosters para top 8",
    location: "Online",
    created_at: new Date().toISOString(),
  },
  {
    id: "mock-tournament-2",
    name: "Liga Pokémon — Pré-release",
    game_code: "POKEMON",
    format_code: "STANDARD",
    pairing_format: "swiss",
    status: "draft",
    max_players: 16,
    entry_fee_cents: 0,
    starts_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    description: null,
    prizes: null,
    location: "Loja física",
    created_at: new Date().toISOString(),
  },
];

export function buildSellerTournamentsMock(): SellerTournamentRow[] {
  return BASE.map((row) => normalizeSellerTournament(row));
}
