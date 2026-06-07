import { lorcanaBanlist } from "@/lib/deck-validator/seeds/lorcana-banlist";
import type { Banlist, BanlistEntry, TCGId } from "@/lib/deck-validator/schema";

const CACHE = new Map<string, Banlist>();

function cacheKey(tcg: TCGId, format: string): string {
  return `${tcg}:${format}`;
}

export class BanlistService {
  async getBanlist(tcg: TCGId, format: string): Promise<Banlist> {
    const key = cacheKey(tcg, format);
    if (CACHE.has(key)) return CACHE.get(key)!;

    const seed = tcg === "lorcana" ? lorcanaBanlist : { version: "default", cards: {} };
    const cards = new Map<string, BanlistEntry>(Object.entries(seed.cards));
    const banlist: Banlist = { tcg, format, version: seed.version, cards };
    CACHE.set(key, banlist);
    return banlist;
  }
}
