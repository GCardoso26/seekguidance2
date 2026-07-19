import type { GamePersonaPack, GameSlug, Persona } from "../core/types.ts";
import { digimonPersonas } from "./digimon/index.ts";
import { dragonballPersonas } from "./dragonball/index.ts";
import { lorcanaPersonas } from "./lorcana/index.ts";
import { mtgPersonas } from "./mtg/index.ts";
import { narutoPersonas } from "./naruto/index.ts";
import { onepiecePersonas } from "./onepiece/index.ts";
import { pokemonPersonas } from "./pokemon/index.ts";
import { riftboundPersonas } from "./riftbound/index.ts";

export const GAME_PERSONA_PACKS: Record<GameSlug, GamePersonaPack> = {
  lorcana: lorcanaPersonas,
  mtg: mtgPersonas,
  pokemon: pokemonPersonas,
  onepiece: onepiecePersonas,
  digimon: digimonPersonas,
  dragonball: dragonballPersonas,
  riftbound: riftboundPersonas,
  naruto: narutoPersonas,
};

export function listAllPersonas(): Persona[] {
  return Object.values(GAME_PERSONA_PACKS).flatMap((p) => p.personas);
}

export function getPersonaById(id: string): Persona | undefined {
  return listAllPersonas().find((p) => p.id === id);
}

export function getPersonasForGame(game: GameSlug): Persona[] {
  return GAME_PERSONA_PACKS[game]?.personas ?? [];
}

/** Aliases canônicos para Playwright (independentes do TCG). */
export const CANONICAL_ALIASES = {
  "seller-alpha": "lorcana-store-alpha",
  "buyer-alpha": "lorcana-competitive-buyer",
  "collector-alpha": "lorcana-collector",
} as const;

export function resolveCanonicalAlias(alias: string): Persona | undefined {
  const mapped = (CANONICAL_ALIASES as Record<string, string>)[alias] ?? alias;
  return getPersonaById(mapped);
}
