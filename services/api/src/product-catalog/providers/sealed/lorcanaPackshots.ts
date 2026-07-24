import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export type LorcanaPackshotEntry = {
  sku: string;
  setCode: string;
  ravensburgerProductId: string;
  sourceUrl: string;
  productLabel?: string;
};

type Manifest = {
  version: number;
  items: LorcanaPackshotEntry[];
};

const __dirname = dirname(fileURLToPath(import.meta.url));

let cached: Map<string, LorcanaPackshotEntry> | null = null;

export function loadLorcanaPackshotBySku(): Map<string, LorcanaPackshotEntry> {
  if (cached) return cached;
  const raw = JSON.parse(
    readFileSync(join(__dirname, "../../sources/lorcana/sealed-packshots.manifest.json"), "utf8"),
  ) as Manifest;
  cached = new Map(raw.items.map((item) => [item.sku.toUpperCase(), item]));
  return cached;
}

/** Test helper — clear memoization between cases. */
export function resetLorcanaPackshotCache(): void {
  cached = null;
}

export function packshotUrlForSku(sku: string): string | undefined {
  return loadLorcanaPackshotBySku().get(sku.toUpperCase())?.sourceUrl;
}
