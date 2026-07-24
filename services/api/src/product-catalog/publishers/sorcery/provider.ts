import {
  createPublisherSealedProvider,
  type PublisherSetSeed,
} from "../_shared/createPublisherSealedProvider.js";
import { createPackshotUrlForSku } from "../../providers/sealed/publisherPackshots.js";

const packshotUrlForSku = createPackshotUrlForSku("sorcery");

/**
 * ADR-016: Sorcery: Contested Realm entry — no known public sets API yet.
 * SORCERY_SETS_URL is an optional operator-provided override; without it we
 * skip straight to the honest seed instead of fetching a placeholder CDN.
 */
async function fetchSets(): Promise<PublisherSetSeed[]> {
  const url = process.env.SORCERY_SETS_URL?.trim();
  if (!url) return seedFallback();
  try {
    const res = await fetch(url);
    if (!res.ok) return seedFallback();
    const body = (await res.json()) as unknown;
    const rows = Array.isArray(body) ? body : (body as { data?: unknown[] }).data ?? [];
    return (rows as Array<Record<string, unknown>>)
      .map((s) => ({
        code: String(s.code ?? s.id ?? s.set_code ?? s.set_name ?? "").slice(0, 32),
        name: String(s.name ?? s.set_name ?? s.set_code ?? ""),
        releaseDate: s.tcg_date ? String(s.tcg_date) : s.release_date ? String(s.release_date) : undefined,
        imageUrl: (s.image as string) || (s.logo as string) || undefined,
        logoUrl: (s.logo as string) || undefined,
      }))
      .filter((s) => s.code && s.name)
      .slice(0, 80);
  } catch {
    return seedFallback();
  }
}

function seedFallback(): PublisherSetSeed[] {
  // ADR-016: no fake CDN placeholder — omit imageUrl until a verified official packshot exists.
  return [
    {
      code: "SORCERY-S1",
      name: "Sorcery: Contested Realm — Alpha",
    },
  ];
}

export const SorcerySealedProvider = createPublisherSealedProvider({
  providerId: "sorcery-sealed",
  game: "SORCERY",
  publisher: "Erik's Curiosa Limited",
  brand: "Sorcery: Contested Realm",
  fetchSets,
  packshotUrlForSku,
});
