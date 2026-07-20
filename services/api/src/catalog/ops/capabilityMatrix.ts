import type { GameCapabilities } from "../providers/interfaces/GameConfiguration.js";
import { getGameConfig, listGameConfigs } from "../providers/gameConfigRegistry.js";
import type { GameConfiguration } from "../providers/interfaces/GameConfiguration.js";

export type CapabilityRow = {
  id: keyof GameCapabilities;
  label: string;
};

export const CAPABILITY_ROWS: CapabilityRow[] = [
  { id: "foil", label: "Foil" },
  { id: "etched", label: "Etched" },
  { id: "serialized", label: "Serialized" },
  { id: "reverseHolo", label: "Reverse Holo" },
  { id: "enchantedStyleRarities", label: "Enchanted" },
  { id: "collectorNumber", label: "Collector Number" },
  { id: "commanderStyle", label: "Commander" },
  { id: "multiLanguageListings", label: "Multi-language" },
  { id: "competitiveFormats", label: "Competitive formats" },
  { id: "sealedProduct", label: "Sealed" },
];

/** Scaffold R3/R4 para matriz (capabilities conhecidas por produto). */
export const PLANNED_CAPABILITIES: Record<string, Partial<GameCapabilities>> = {
  ONEPIECE: {
    foil: true,
    etched: false,
    serialized: false,
    reverseHolo: false,
    enchantedStyleRarities: false,
    collectorNumber: true,
    commanderStyle: false,
    multiLanguageListings: true,
    competitiveFormats: true,
    sealedProduct: false,
  },
};

export type CapabilityMatrix = {
  games: string[];
  rows: Array<{ label: string; cells: Record<string, boolean | null> }>;
};

export function buildCapabilityMatrix(extraGames?: string[]): CapabilityMatrix {
  const configs = listGameConfigs();
  const gameCodes = configs.map((c) => c.gameCode);
  if (extraGames) {
    for (const g of extraGames) {
      if (!gameCodes.includes(g)) gameCodes.push(g);
    }
  }
  const defaultOrder = ["MTG", "LORCANA", "POKEMON", "ONEPIECE"];
  const games = [...new Set([...defaultOrder.filter((g) => gameCodes.includes(g)), ...gameCodes])];

  const rows = CAPABILITY_ROWS.map((row) => {
    const cells: Record<string, boolean | null> = {};
    for (const game of games) {
      const cfg = getGameConfig(game);
      if (cfg) {
        cells[game] = cfg.capabilities[row.id];
      } else if (PLANNED_CAPABILITIES[game]) {
        const p = PLANNED_CAPABILITIES[game][row.id];
        cells[game] = p === undefined ? null : p;
      } else {
        cells[game] = null;
      }
    }
    return { label: row.label, cells };
  });

  return { games, rows };
}

export function capabilitiesScore(cfg: GameConfiguration): number {
  const keys = CAPABILITY_ROWS.map((r) => r.id);
  const on = keys.filter((k) => cfg.capabilities[k]).length;
  return Math.round((on / keys.length) * 100);
}
