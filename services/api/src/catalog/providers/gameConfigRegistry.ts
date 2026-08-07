import type { GameConfiguration } from "./interfaces/GameConfiguration.js";
import { gundamGameConfig } from "./gundam/GameConfig.js";
import { lorcanaGameConfig } from "./lorcana/GameConfig.js";
import { mtgGameConfig } from "./magic/GameConfig.js";
import { pokemonGameConfig } from "./pokemon/GameConfig.js";

const BY_CODE: Record<string, GameConfiguration> = {
  LORCANA: lorcanaGameConfig,
  MTG: mtgGameConfig,
  POKEMON: pokemonGameConfig,
  GUNDAM: gundamGameConfig,
};

/** Lookup canônico — preferir a if (game === …) no domínio. */
export function getGameConfig(gameCode: string): GameConfiguration | undefined {
  const key = gameCode.trim().toUpperCase();
  const aliases: Record<string, string> = {
    MAGIC: "MTG",
    "MAGIC:THEGATHERING": "MTG",
    PKM: "POKEMON",
    POKÉMON: "POKEMON",
    "GUNDAMCARDGAME": "GUNDAM",
    "GUNDAM-CARD-GAME": "GUNDAM",
  };
  const normalized = aliases[key] ?? key;
  return BY_CODE[normalized];
}

export function listGameConfigs(): GameConfiguration[] {
  return Object.values(BY_CODE);
}

export function requireGameConfig(gameCode: string): GameConfiguration {
  const cfg = getGameConfig(gameCode);
  if (!cfg) throw new Error(`unknown_game_config:${gameCode}`);
  return cfg;
}
