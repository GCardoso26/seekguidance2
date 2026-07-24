import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export type PublisherPackshotEntry = {
  sku: string;
  sourceUrl: string;
  productLabel?: string;
};

type Manifest = {
  version?: number;
  purpose?: string;
  items: PublisherPackshotEntry[];
};

const __dirname = dirname(fileURLToPath(import.meta.url));

const cache = new Map<string, Map<string, PublisherPackshotEntry>>();

/**
 * Generic sealed-packshot manifest loader (ADR-016 packshot allowlist).
 * Mirrors lorcanaPackshots.ts but keyed by `sources/<gameFolder>/sealed-packshots.manifest.json`
 * so each publisher can start with an empty (honest) manifest and fill it in only with
 * verified official CDN URLs.
 */
function loadManifest(gameFolder: string): Map<string, PublisherPackshotEntry> {
  const cached = cache.get(gameFolder);
  if (cached) return cached;
  let items: PublisherPackshotEntry[] = [];
  try {
    const raw = JSON.parse(
      readFileSync(join(__dirname, `../../sources/${gameFolder}/sealed-packshots.manifest.json`), "utf8"),
    ) as Manifest;
    items = Array.isArray(raw.items) ? raw.items : [];
  } catch {
    items = [];
  }
  const bySku = new Map(items.map((item) => [item.sku.toUpperCase(), item]));
  cache.set(gameFolder, bySku);
  return bySku;
}

/** Test helper — clear memoization between cases. */
export function resetPublisherPackshotCache(gameFolder?: string): void {
  if (gameFolder) cache.delete(gameFolder);
  else cache.clear();
}

/** Builds a `packshotUrlForSku` lookup bound to a single game's manifest folder. */
export function createPackshotUrlForSku(gameFolder: string): (sku: string) => string | undefined {
  return (sku: string) => loadManifest(gameFolder).get(sku.toUpperCase())?.sourceUrl;
}
