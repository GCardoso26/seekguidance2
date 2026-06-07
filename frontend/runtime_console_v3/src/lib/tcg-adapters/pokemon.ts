import { parsePokemonDecklist } from "@/lib/tcg-adapters/parse-decklist";
import type { GameAdapter, TournamentFormat } from "@/lib/tcg-adapters/types";

const FORMATS: TournamentFormat[] = [
  { code: "STANDARD", name: "Standard", decklist_required: true, decklist_validation: true, default_timer_minutes: 50, default_match_type: "BO3", default_swiss_rounds: "auto", default_top_cut: 8 },
  { code: "EXPANDED", name: "Expanded", decklist_required: true, decklist_validation: true, default_timer_minutes: 50, default_match_type: "BO3", default_swiss_rounds: "auto", default_top_cut: 8 },
  { code: "LIMITED", name: "Limited", decklist_required: false, decklist_validation: false, default_timer_minutes: 50, default_match_type: "BO3", default_swiss_rounds: "auto", default_top_cut: 8 },
];

export const pokemonAdapter: GameAdapter = {
  code: "POKEMON",
  name: "Pokémon TCG",
  slug: "pokemon",
  supportedFormats: FORMATS,
  parseDecklist: parsePokemonDecklist,
  getDecklistHint: () =>
    "Exatamente 60 cartas. Máx. 4 cópias por nome (Basic Energy ilimitada). Pelo menos 1 Pokémon Básico.",
  getMaxCopies: () => 4,
  getMinDeckSize: () => 60,
  getMaxDeckSize: () => 60,
  getSideboardRules: () => null,
};
