import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { LorcanaDataset, LorcanaDatasetCard, LorcanaDatasetSet } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_DATASET_PATH = join(__dirname, "cards.json");

let cached: LorcanaDataset | null = null;

export function loadLorcanaDataset(path: string = DEFAULT_DATASET_PATH): LorcanaDataset {
  if (cached && path === DEFAULT_DATASET_PATH) return cached;
  const raw = readFileSync(path, "utf8");
  const data = JSON.parse(raw) as LorcanaDataset;
  assertDataset(data);
  if (path === DEFAULT_DATASET_PATH) cached = data;
  return data;
}

/** Test helper — clear module cache between fixtures. */
export function clearLorcanaDatasetCache(): void {
  cached = null;
}

export function listSets(dataset: LorcanaDataset = loadLorcanaDataset()): LorcanaDatasetSet[] {
  return dataset.sets;
}

export function listCardsBySet(
  setRef: string,
  dataset: LorcanaDataset = loadLorcanaDataset(),
): LorcanaDatasetCard[] {
  const ref = setRef.trim().toUpperCase();
  return dataset.cards.filter(
    (c) => c.setCode.toUpperCase() === ref || c.setId === setRef || c.setId.toUpperCase() === ref,
  );
}

export function getCardById(
  id: string,
  dataset: LorcanaDataset = loadLorcanaDataset(),
): LorcanaDatasetCard | undefined {
  return dataset.cards.find((c) => c.id === id);
}

function assertDataset(data: LorcanaDataset): void {
  if (!data || typeof data.schemaVersion !== "number") {
    throw new Error("lorcana_dataset_invalid:schemaVersion");
  }
  if (!Array.isArray(data.sets) || !Array.isArray(data.cards)) {
    throw new Error("lorcana_dataset_invalid:sets_or_cards");
  }
}
