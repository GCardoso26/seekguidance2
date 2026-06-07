import { parseGenericDecklist } from "@/lib/tcg-adapters/parse-decklist";
import type { GameAdapter, TournamentFormat } from "@/lib/tcg-adapters/types";

const FORMATS: TournamentFormat[] = [
  { code: "CONSTRUCTED", name: "Constructed", decklist_required: true, decklist_validation: true, default_timer_minutes: 55, default_match_type: "BO3", default_swiss_rounds: "auto", default_top_cut: 8 },
  { code: "LIMITED", name: "Limited", decklist_required: false, decklist_validation: false, default_timer_minutes: 55, default_match_type: "BO3", default_swiss_rounds: "auto", default_top_cut: 8 },
];

export const lorcanaAdapter: GameAdapter = {
  code: "LORCANA",
  name: "Disney Lorcana",
  slug: "lorcana",
  supportedFormats: FORMATS,
  parseDecklist: (raw, format) => parseGenericDecklist(raw, "lorcana", format),
  getDecklistHint: () =>
    "Exatamente 60 cartas. Máx. 4 cópias por nome (independente de arte/foil). Pelo menos 1 Personagem.",
  getMaxCopies: () => 4,
  getMinDeckSize: () => 60,
  getMaxDeckSize: () => 60,
  getSideboardRules: () => null,
};
