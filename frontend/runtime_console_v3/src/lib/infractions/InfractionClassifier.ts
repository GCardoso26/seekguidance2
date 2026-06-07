import type {
  InfractionCategory,
  InfractionSeverity,
  InfractionType,
  TournamentLevel,
} from "@/lib/infractions/schema";

const KEYWORDS: Record<InfractionType, string[]> = {
  slow_play: ["tempo", "demorando", "timeout", "clock", "lento"],
  deck_error: ["carta errada", "deck", "sideboard", "banlist", "lista"],
  marked_cards: ["marcada", "marcado", "marcacao"],
  insufficient_shuffling: ["embaralhar", "shuffle", "ordem", "fora de ordem"],
  communication_error: ["comunicacao", "avisou", "nao avisou"],
  game_rule_violation: ["regra", "violação", "violacao"],
  illegal_play: ["jogada ilegal", "ilegal"],
  illegal_chain: ["chain", "pilha", "stack"],
  illegal_summon: ["summon", "invocar"],
  illegal_ride: ["ride", "g-unit"],
  drive_check_error: ["drive check", "drive"],
  security_error: ["security", "seguranca"],
  bounty_error: ["bounty", "recompensa"],
  illegal_movement: ["movimento", "reposicionar"],
  cheating: ["trapaceou", "trapaca", "colou", "viu carta", "marcou"],
  outside_assistance: ["ajuda externa", "coach", "terceiro"],
  unsporting_conduct: ["comportamento", "insulto", "toxico"],
  improperly_determining_winner: ["vencedor", "resultado errado"],
  other: [],
};

const SEVERITY: Record<InfractionType, InfractionSeverity> = {
  slow_play: "minor",
  deck_error: "major",
  marked_cards: "minor",
  insufficient_shuffling: "minor",
  communication_error: "minor",
  game_rule_violation: "major",
  illegal_play: "major",
  illegal_chain: "major",
  illegal_summon: "major",
  illegal_ride: "major",
  drive_check_error: "major",
  security_error: "major",
  bounty_error: "minor",
  illegal_movement: "major",
  cheating: "severe",
  outside_assistance: "severe",
  unsporting_conduct: "major",
  improperly_determining_winner: "severe",
  other: "minor",
};

const CATEGORY: Record<InfractionType, InfractionCategory> = {
  slow_play: "procedural",
  deck_error: "procedural",
  marked_cards: "procedural",
  insufficient_shuffling: "procedural",
  communication_error: "procedural",
  game_rule_violation: "gameplay",
  illegal_play: "gameplay",
  illegal_chain: "gameplay",
  illegal_summon: "gameplay",
  illegal_ride: "gameplay",
  drive_check_error: "gameplay",
  security_error: "gameplay",
  bounty_error: "gameplay",
  illegal_movement: "gameplay",
  cheating: "ethical",
  outside_assistance: "ethical",
  unsporting_conduct: "ethical",
  improperly_determining_winner: "ethical",
  other: "procedural",
};

export type ClassificationResult = {
  suggested_type: InfractionType;
  suggested_severity: InfractionSeverity;
  suggested_category: InfractionCategory;
  confidence: number;
};

export class InfractionClassifier {
  classify(description: string, _logSequences: number[] = []): ClassificationResult {
    const desc = description.toLowerCase();
    let best: InfractionType = "other";
    let bestScore = 0;

    for (const [type, words] of Object.entries(KEYWORDS) as [InfractionType, string[]][]) {
      if (type === "other") continue;
      const score = words.reduce((acc, w) => (desc.includes(w) ? acc + 1 : acc), 0);
      if (score > bestScore) {
        bestScore = score;
        best = type;
      }
    }

    const wordCount = KEYWORDS[best].length || 1;
    const confidence = Math.min(bestScore / wordCount, 1);

    return {
      suggested_type: best,
      suggested_severity: SEVERITY[best],
      suggested_category: CATEGORY[best],
      confidence: bestScore > 0 ? confidence : 0.2,
    };
  }

  calculateSLA(level: TournamentLevel, from = new Date()): Date {
    const minutes = { casual: 10, regular: 5, competitive: 2 }[level];
    return new Date(from.getTime() + minutes * 60_000);
  }
}
