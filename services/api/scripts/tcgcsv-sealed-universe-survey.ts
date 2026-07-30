/**
 * Survey: how many sealed products exist in TCGCSV per game (no caps, no DB write).
 * Feeds the global/per-game cap sizing in docs/SEALED_PRODUCT_IMAGE_PROVIDERS.md.
 *
 * Usage: npx tsx scripts/tcgcsv-sealed-universe-survey.ts [--concurrency 8]
 */
import { writeFileSync } from "node:fs";
import {
  TCGCSV_CATEGORY_BY_GAME,
  isSealedTcgCsvProduct,
} from "../src/product-catalog/providers/sealed/TcgCsvSealedProvider.js";

const TCGCSV = "https://tcgcsv.com/tcgplayer";
const UA = "JudgeTCG/product-catalog (https://judgetcg.com.br)";
const concurrencyIdx = process.argv.indexOf("--concurrency");
const CONCURRENCY = concurrencyIdx >= 0 ? Number(process.argv[concurrencyIdx + 1]) : 8;

type Group = { groupId?: number; name?: string; publishedOn?: string };
type Product = { productId?: number; name?: string; cleanName?: string; imageUrl?: string };

async function getJson<T>(url: string, attempts = 3): Promise<T | null> {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json", "User-Agent": UA } });
      if (res.ok) return (await res.json()) as T;
      if (res.status >= 400 && res.status < 500 && res.status !== 429) return null;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 400 * (i + 1)));
  }
  return null;
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      out[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return out;
}

type GameSurvey = {
  game: string;
  categoryId: number;
  groups: number;
  groupsFetched: number;
  groupsFailed: number;
  products: number;
  sealed: number;
  sealedWithImage: number;
  sealedByYear: Record<string, number>;
};

const results: GameSurvey[] = [];

for (const [game, categoryId] of Object.entries(TCGCSV_CATEGORY_BY_GAME)) {
  const groupsBody = await getJson<{ results?: Group[] }>(`${TCGCSV}/${categoryId}/groups`);
  const groups = (groupsBody?.results ?? []).filter((g) => g.groupId != null);
  const survey: GameSurvey = {
    game,
    categoryId,
    groups: groups.length,
    groupsFetched: 0,
    groupsFailed: 0,
    products: 0,
    sealed: 0,
    sealedWithImage: 0,
    sealedByYear: {},
  };

  await mapLimit(groups, CONCURRENCY, async (g) => {
    const body = await getJson<{ results?: Product[] }>(
      `${TCGCSV}/${categoryId}/${g.groupId}/products`,
    );
    if (!body?.results) {
      survey.groupsFailed++;
      return;
    }
    survey.groupsFetched++;
    const year = String(g.publishedOn ?? "").slice(0, 4) || "unknown";
    for (const p of body.results) {
      survey.products++;
      const name = String(p.name || p.cleanName || "").trim();
      if (!name || !isSealedTcgCsvProduct(name)) continue;
      survey.sealed++;
      survey.sealedByYear[year] = (survey.sealedByYear[year] ?? 0) + 1;
      if (p.imageUrl) survey.sealedWithImage++;
    }
  });

  results.push(survey);
  console.error(
    `${game} cat=${categoryId} groups=${survey.groups} sealed=${survey.sealed} withImage=${survey.sealedWithImage} failed=${survey.groupsFailed}`,
  );
}

const totals = results.reduce(
  (acc, r) => ({
    groups: acc.groups + r.groups,
    products: acc.products + r.products,
    sealed: acc.sealed + r.sealed,
    sealedWithImage: acc.sealedWithImage + r.sealedWithImage,
    groupsFailed: acc.groupsFailed + r.groupsFailed,
  }),
  { groups: 0, products: 0, sealed: 0, sealedWithImage: 0, groupsFailed: 0 },
);

const payload = {
  generatedAt: new Date().toISOString(),
  totals,
  maxGroupsPerGame: Math.max(...results.map((r) => r.groups)),
  maxSealedPerGame: Math.max(...results.map((r) => r.sealed)),
  games: results.sort((a, b) => b.sealed - a.sealed),
};

writeFileSync(".tmp/tcgcsv-sealed-universe.json", JSON.stringify(payload, null, 2));
console.log(JSON.stringify(payload, null, 2));
