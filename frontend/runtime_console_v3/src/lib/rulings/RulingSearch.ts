import type { GameLogEntry } from "@/lib/game-log/schema";
import type { TCGId } from "@/lib/game-log/schema";
import { lorcanaRulings } from "@/lib/rulings/seeds/lorcana";
import type { Ruling, SearchOptions } from "@/lib/rulings/schema";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function toRuling(dto: (typeof lorcanaRulings)[number], index: number): Ruling {
  const now = new Date().toISOString();
  return {
    id: `seed-${dto.tcg}-${index}`,
    ...dto,
    community_votes: {
      upvotes: 0,
      downvotes: 0,
      verified_by: dto.hierarchy === "official" ? ["system"] : [],
      disputed_by: [],
    },
    created_at: now,
    updated_at: now,
  };
}

const IN_MEMORY: Ruling[] = lorcanaRulings.map((r, i) => toRuling(r, i));

export class RulingSearch {
  constructor(private readonly corpus: Ruling[] = IN_MEMORY) {}

  search(query: string, options: SearchOptions = {}): Ruling[] {
    const q = normalize(query).trim();
    const limit = options.limit ?? 20;
    const matched = this.corpus.filter((r) => this.matchesOptions(r, options));
    // Query vazia: listar corpus filtrado (página de rulings abre sem busca).
    if (!q) {
      return matched.slice(0, limit);
    }
    return matched
      .map((r) => ({ ruling: r, score: this.score(r, q) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((x) => x.ruling);
  }

  findByCards(cardIds: string[], tcg: TCGId): Ruling[] {
    return this.corpus.filter(
      (r) => r.tcg === tcg && cardIds.some((id) => r.cards_involved.includes(id)),
    );
  }

  findByKeywords(keywords: string[], tcg: TCGId): Ruling[] {
    const normalized = keywords.map(normalize);
    return this.corpus.filter(
      (r) =>
        r.tcg === tcg &&
        normalized.some((kw) => r.keywords_involved.map(normalize).includes(kw)),
    );
  }

  findByScenario(scenario: string, tcg: TCGId): Ruling[] {
    return this.search(scenario, { tcg, limit: 10 });
  }

  suggestRulings(logEntry: GameLogEntry): Ruling[] {
    const keywords = Object.keys(logEntry.action.details)
      .concat(logEntry.action.type)
      .map(String);
    const fromKeywords = this.findByKeywords(keywords, logEntry.action.tcg);
    const fromAction = this.search(logEntry.action.type, {
      tcg: logEntry.action.tcg,
      limit: 5,
    });
    const merged = new Map<string, Ruling>();
    for (const r of [...fromKeywords, ...fromAction]) merged.set(r.id, r);
    return [...merged.values()];
  }

  private matchesOptions(ruling: Ruling, options: SearchOptions): boolean {
    if (options.tcg && ruling.tcg !== options.tcg) return false;
    if (options.status?.length && !options.status.includes(ruling.status)) return false;
    if (options.hierarchy?.length && !options.hierarchy.includes(ruling.hierarchy)) return false;
    if (options.language && ruling.language !== options.language) return false;
    return true;
  }

  private score(ruling: Ruling, query: string): number {
    if (!query) return 0;
    const haystack = normalize(
      [ruling.title, ruling.description, ruling.question, ruling.answer, ruling.tags.join(" ")].join(
        " ",
      ),
    );
    const tokens = query.split(/\s+/).filter(Boolean);
    return tokens.reduce((acc, token) => (haystack.includes(token) ? acc + 1 : acc), 0);
  }
}
