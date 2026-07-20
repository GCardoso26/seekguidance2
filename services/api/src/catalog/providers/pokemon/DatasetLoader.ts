import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { PokemonDataset, PokemonDatasetCard, PokemonDatasetSet } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

let cache: PokemonDataset | null = null;

export function clearPokemonDatasetCache(): void {
  cache = null;
}

export function loadPokemonDataset(): PokemonDataset {
  if (cache) return cache;
  const raw = readFileSync(join(__dirname, "cards.json"), "utf8");
  cache = JSON.parse(raw) as PokemonDataset;
  return cache;
}

export function listSets(): PokemonDatasetSet[] {
  return loadPokemonDataset().sets;
}

export function listCardsBySet(setRef: string): PokemonDatasetCard[] {
  const code = setRef.toUpperCase();
  return loadPokemonDataset().cards.filter(
    (c) => c.setCode.toUpperCase() === code || c.setCode.toUpperCase() === setRef.toUpperCase(),
  );
}

export function getCardById(id: string): PokemonDatasetCard | undefined {
  return loadPokemonDataset().cards.find((c) => c.id === id);
}
