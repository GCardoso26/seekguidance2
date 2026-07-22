/**
 * Theme Engine V2 — Game Identity System (FE only).
 * Cada TCG = design system próprio (cores, tipografia, hero, motion, superfícies).
 * Sem novos BCs — consome apenas GAME_TOKENS + identidade visual.
 */
import type { CSSProperties } from "react";
import {
  ALL_GAME_IDS,
  GAME_TOKENS,
  type GameToken,
  gameIdFromSlug,
} from "@/lib/tcg-tokens";
import type { GameId } from "@/types/card";

export type HeroAnimation =
  | "fog"
  | "glow"
  | "stars"
  | "energy"
  | "scanlines"
  | "waves"
  | "aura"
  | "runes"
  | "none";

export type HeroOverlay = "gradient-dark" | "gradient-light" | "vignette" | "neon" | "parchment";

export type SurfaceMood = "dark" | "light" | "mixed";

export type MotionPreset = {
  hoverLift: string;
  hoverGlow: string;
  cardTransition: string;
  heroEntrance: string;
};

export type GameHeroConfig = {
  /** Optional cinematic still — CSS atmosphere used when absent */
  image?: string;
  /** Structure only — video hero wiring for future assets */
  video?: string;
  animation: HeroAnimation;
  overlay: HeroOverlay;
  tagline: string;
  description: string;
  ctaPrimary: string;
  ctaSecondary: string;
};

export type GameSurfaces = {
  mood: SurfaceMood;
  bg: string;
  bgElevated: string;
  accent: string;
  accentMuted: string;
  heroGlow: string;
  border: string;
  text: string;
  textMuted: string;
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
  cardRadius: string;
  buttonRadius: string;
  shadow: string;
  texture?: "none" | "parchment" | "wood" | "hex" | "scan" | "stars" | "sand" | "metal";
};

export type GameTypography = {
  display: string;
  body: string;
  tracking: string;
  displayWeight: number;
};

export type GameTheme = GameToken & {
  gameId: GameId;
  /** @deprecated prefer surfaces.bg — kept for V1 callers */
  bg: string;
  /** @deprecated prefer surfaces.accent */
  accent: string;
  /** @deprecated prefer surfaces.heroGlow */
  heroGlow: string;
  surfaces: GameSurfaces;
  typography: GameTypography;
  hero: GameHeroConfig;
  motion: MotionPreset;
  marketplace: {
    skin: string;
    density: "airy" | "compact" | "cinematic";
  };
  collection: { panelTint: string };
  deckBuilder: { workspaceTint: string };
};

type IdentitySeed = {
  surfaces: GameSurfaces;
  typography: GameTypography;
  hero: GameHeroConfig;
  motion: MotionPreset;
  marketplace: GameTheme["marketplace"];
  collection: GameTheme["collection"];
  deckBuilder: GameTheme["deckBuilder"];
};

const DEFAULT_MOTION: MotionPreset = {
  hoverLift: "translateY(-4px) scale(1.01)",
  hoverGlow: "0 12px 32px color-mix(in srgb, var(--game-primary) 28%, transparent)",
  cardTransition: "transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease",
  heroEntrance: "portal-hero-enter 0.7s cubic-bezier(0.16, 1, 0.3, 1) both",
};

/** Full identity per game — clearly distinct portals. */
const IDENTITY: Record<GameId, IdentitySeed> = {
  MTG: {
    surfaces: {
      mood: "dark",
      bg: "#0a0908",
      bgElevated: "#161210",
      accent: "#c9a227",
      accentMuted: "#7c6a3a",
      heroGlow: "#5b21b655",
      border: "#3f3a3522",
      text: "#f5f0e8",
      textMuted: "#a8a29e",
      gradientFrom: "#0c0a09",
      gradientVia: "#1e1030",
      gradientTo: "#0f172a",
      cardRadius: "0.5rem",
      buttonRadius: "0.375rem",
      shadow: "0 20px 50px rgba(0,0,0,0.55)",
      texture: "parchment",
    },
    typography: {
      display: '"Cinzel", "Palatino Linotype", "Book Antiqua", Georgia, serif',
      body: 'Georgia, "Source Serif 4", "Times New Roman", serif',
      tracking: "0.04em",
      displayWeight: 600,
    },
    hero: {
      animation: "fog",
      overlay: "gradient-dark",
      tagline: "O grimório está aberto",
      description:
        "Mana, dragões e expansões épicas. Explore singles, decks e o marketplace neste universo medieval.",
      ctaPrimary: "Explorar singles",
      ctaSecondary: "Ver expansões",
    },
    motion: {
      ...DEFAULT_MOTION,
      hoverGlow: "0 0 28px rgba(201,162,39,0.35), 0 16px 40px rgba(91,33,182,0.25)",
    },
    marketplace: { skin: "grimorio", density: "cinematic" },
    collection: { panelTint: "#1a1520" },
    deckBuilder: { workspaceTint: "#120e14" },
  },
  POKEMON: {
    surfaces: {
      mood: "light",
      bg: "#f8fafc",
      bgElevated: "#ffffff",
      accent: "#3B4CCA",
      accentMuted: "#93c5fd",
      heroGlow: "#FFCB0540",
      border: "#e2e8f0",
      text: "#0f172a",
      textMuted: "#64748b",
      gradientFrom: "#ffffff",
      gradientVia: "#fef9c3",
      gradientTo: "#dbeafe",
      cardRadius: "1.25rem",
      buttonRadius: "9999px",
      shadow: "0 16px 40px rgba(59,76,202,0.12)",
      texture: "none",
    },
    typography: {
      display: '"Nunito", "Trebuchet MS", "Segoe UI", system-ui, sans-serif',
      body: '"Nunito", "Segoe UI", system-ui, sans-serif',
      tracking: "-0.01em",
      displayWeight: 800,
    },
    hero: {
      animation: "energy",
      overlay: "gradient-light",
      tagline: "Temos que pegar!",
      description:
        "Colecionismo limpo e colorido. Cartas grandes, expansões e ofertas com a energia do Pokémon TCG.",
      ctaPrimary: "Ver cartas",
      ctaSecondary: "Marketplace",
    },
    motion: {
      ...DEFAULT_MOTION,
      hoverLift: "translateY(-6px) scale(1.02)",
      hoverGlow: "0 18px 36px rgba(255,203,5,0.35)",
    },
    marketplace: { skin: "energy", density: "airy" },
    collection: { panelTint: "#fffbeb" },
    deckBuilder: { workspaceTint: "#eff6ff" },
  },
  YGO: {
    surfaces: {
      mood: "dark",
      bg: "#120a04",
      bgElevated: "#1c1208",
      accent: "#facc15",
      accentMuted: "#a16207",
      heroGlow: "#8B000055",
      border: "#78350f44",
      text: "#fef3c7",
      textMuted: "#d6d3d1",
      gradientFrom: "#1c0a05",
      gradientVia: "#422006",
      gradientTo: "#0c0a09",
      cardRadius: "0.375rem",
      buttonRadius: "0.25rem",
      shadow: "0 18px 42px rgba(120,53,15,0.45)",
      texture: "sand",
    },
    typography: {
      display: '"Cinzel", "Trajan Pro", Georgia, serif',
      body: 'Georgia, serif',
      tracking: "0.08em",
      displayWeight: 700,
    },
    hero: {
      animation: "runes",
      overlay: "parchment",
      tagline: "É hora do duelo",
      description:
        "Templo, ouro e hieróglifos. Cartas lendárias, decks e marketplace sob o Olho do Milênio.",
      ctaPrimary: "Singles",
      ctaSecondary: "Decks",
    },
    motion: DEFAULT_MOTION,
    marketplace: { skin: "temple", density: "cinematic" },
    collection: { panelTint: "#1a1008" },
    deckBuilder: { workspaceTint: "#140c06" },
  },
  LORCANA: {
    surfaces: {
      mood: "dark",
      bg: "#07101f",
      bgElevated: "#0f1c35",
      accent: "#f59e0b",
      accentMuted: "#1e3a8a",
      heroGlow: "#60a5fa55",
      border: "#1e3a8a44",
      text: "#f8fafc",
      textMuted: "#94a3b8",
      gradientFrom: "#0b1224",
      gradientVia: "#1e3a8a",
      gradientTo: "#0f172a",
      cardRadius: "0.75rem",
      buttonRadius: "0.5rem",
      shadow: "0 0 40px rgba(245,158,11,0.2), 0 16px 40px rgba(30,58,138,0.35)",
      texture: "stars",
    },
    typography: {
      display: '"Source Serif 4", "Palatino Linotype", Georgia, serif',
      body: '"IBM Plex Sans", system-ui, sans-serif',
      tracking: "0.02em",
      displayWeight: 600,
    },
    hero: {
      animation: "glow",
      overlay: "neon",
      tagline: "A magia Disney brilha",
      description:
        "Constelações, tinta e lore. Portal Lorcana com brilho, expansões e marketplace encantado.",
      ctaPrimary: "Explorar Lorcana",
      ctaSecondary: "Última expansão",
    },
    motion: {
      ...DEFAULT_MOTION,
      hoverGlow: "0 0 32px rgba(96,165,250,0.45), 0 0 12px rgba(245,158,11,0.35)",
    },
    marketplace: { skin: "inklands", density: "cinematic" },
    collection: { panelTint: "#0c1830" },
    deckBuilder: { workspaceTint: "#0a1428" },
  },
  ONEPIECE: {
    surfaces: {
      mood: "dark",
      bg: "#1a100c",
      bgElevated: "#2a1a14",
      accent: "#ef4444",
      accentMuted: "#7f1d1d",
      heroGlow: "#0ea5e944",
      border: "#78350f55",
      text: "#fff7ed",
      textMuted: "#d6d3d1",
      gradientFrom: "#1c1210",
      gradientVia: "#1e3a5f",
      gradientTo: "#0c4a6e",
      cardRadius: "0.5rem",
      buttonRadius: "0.375rem",
      shadow: "0 16px 36px rgba(28,18,16,0.5)",
      texture: "wood",
    },
    typography: {
      display: '"Impact", "Arial Black", "Segoe UI", sans-serif',
      body: '"IBM Plex Sans", system-ui, sans-serif',
      tracking: "0.03em",
      displayWeight: 700,
    },
    hero: {
      animation: "waves",
      overlay: "gradient-dark",
      tagline: "Embarque na Grand Line",
      description:
        "Mapas, madeira e mar. Singles, decks e selados com atmosfera de pirata.",
      ctaPrimary: "Singles",
      ctaSecondary: "Produtos selados",
    },
    motion: DEFAULT_MOTION,
    marketplace: { skin: "grand-line", density: "compact" },
    collection: { panelTint: "#1f1410" },
    deckBuilder: { workspaceTint: "#18100c" },
  },
  FAB: {
    surfaces: {
      mood: "dark",
      bg: "#1a1008",
      bgElevated: "#2a1810",
      accent: "#fef3c7",
      accentMuted: "#a16207",
      heroGlow: "#7C2D1240",
      border: "#7c2d1244",
      text: "#fef3c7",
      textMuted: "#d6d3d1",
      gradientFrom: "#1c1008",
      gradientVia: "#431407",
      gradientTo: "#0c0a09",
      cardRadius: "0.375rem",
      buttonRadius: "0.25rem",
      shadow: "0 16px 40px rgba(0,0,0,0.5)",
      texture: "parchment",
    },
    typography: {
      display: 'Georgia, "Times New Roman", serif',
      body: '"IBM Plex Sans", system-ui, sans-serif',
      tracking: "0.02em",
      displayWeight: 700,
    },
    hero: {
      animation: "aura",
      overlay: "vignette",
      tagline: "Prove seu valor",
      description: "Combate tático e arte épica. Flesh and Blood no JudgeTCG.",
      ctaPrimary: "Explorar",
      ctaSecondary: "Decks",
    },
    motion: DEFAULT_MOTION,
    marketplace: { skin: "arena", density: "compact" },
    collection: { panelTint: "#1a1008" },
    deckBuilder: { workspaceTint: "#140c08" },
  },
  DIGIMON: {
    surfaces: {
      mood: "dark",
      bg: "#050b14",
      bgElevated: "#0a1628",
      accent: "#38bdf8",
      accentMuted: "#0369a1",
      heroGlow: "#0EA5E944",
      border: "#0ea5e933",
      text: "#e0f2fe",
      textMuted: "#7dd3fc",
      gradientFrom: "#020617",
      gradientVia: "#0c4a6e",
      gradientTo: "#082f49",
      cardRadius: "0.25rem",
      buttonRadius: "0.125rem",
      shadow: "0 0 24px rgba(56,189,248,0.25)",
      texture: "hex",
    },
    typography: {
      display: '"Orbitron", "Rajdhani", "Segoe UI", monospace',
      body: '"IBM Plex Sans", system-ui, sans-serif',
      tracking: "0.12em",
      displayWeight: 700,
    },
    hero: {
      animation: "scanlines",
      overlay: "neon",
      tagline: "DIGITAL WORLD ONLINE",
      description:
        "Hexágonos, glitch e scanlines. Portal cyber para Digimon TCG.",
      ctaPrimary: "LOAD CARDS",
      ctaSecondary: "DECKS",
    },
    motion: {
      ...DEFAULT_MOTION,
      hoverLift: "translateY(-3px)",
      hoverGlow: "0 0 20px rgba(56,189,248,0.5)",
    },
    marketplace: { skin: "digital", density: "compact" },
    collection: { panelTint: "#061018" },
    deckBuilder: { workspaceTint: "#040c14" },
  },
  SWU: {
    surfaces: {
      mood: "dark",
      bg: "#050508",
      bgElevated: "#0c0c12",
      accent: "#38bdf8",
      accentMuted: "#1e293b",
      heroGlow: "#3b82f655",
      border: "#1e293b",
      text: "#f1f5f9",
      textMuted: "#94a3b8",
      gradientFrom: "#020617",
      gradientVia: "#0f172a",
      gradientTo: "#1e1b4b",
      cardRadius: "0.25rem",
      buttonRadius: "0.125rem",
      shadow: "0 0 30px rgba(56,189,248,0.2)",
      texture: "stars",
    },
    typography: {
      display: '"Orbitron", "Eurostile", "Segoe UI", sans-serif',
      body: '"IBM Plex Sans", system-ui, sans-serif',
      tracking: "0.1em",
      displayWeight: 600,
    },
    hero: {
      animation: "stars",
      overlay: "neon",
      tagline: "A guerra pelas estrelas",
      description:
        "Nebulosas, neon e HUD. Star Wars: Unlimited com marketplace espacial.",
      ctaPrimary: "Singles",
      ctaSecondary: "Expansões",
    },
    motion: {
      ...DEFAULT_MOTION,
      hoverGlow: "0 0 28px rgba(56,189,248,0.55)",
    },
    marketplace: { skin: "hyperspace", density: "cinematic" },
    collection: { panelTint: "#08080f" },
    deckBuilder: { workspaceTint: "#06060c" },
  },
  RIFTBOUND: {
    surfaces: {
      mood: "dark",
      bg: "#060a14",
      bgElevated: "#0c1424",
      accent: "#eab308",
      accentMuted: "#854d0e",
      heroGlow: "#C89B3C40",
      border: "#1e293b",
      text: "#f8fafc",
      textMuted: "#cbd5e1",
      gradientFrom: "#060a14",
      gradientVia: "#1e1b4b",
      gradientTo: "#0f172a",
      cardRadius: "0.5rem",
      buttonRadius: "0.375rem",
      shadow: "0 16px 40px rgba(200,155,60,0.2)",
      texture: "stars",
    },
    typography: {
      display: '"Source Serif 4", Georgia, serif',
      body: '"IBM Plex Sans", system-ui, sans-serif',
      tracking: "0.03em",
      displayWeight: 600,
    },
    hero: {
      animation: "glow",
      overlay: "vignette",
      tagline: "Runeterra desperta",
      description:
        "Cristais, magia e paisagens épicas. Riftbound no ecossistema JudgeTCG.",
      ctaPrimary: "Explorar",
      ctaSecondary: "Marketplace",
    },
    motion: DEFAULT_MOTION,
    marketplace: { skin: "runeterra", density: "cinematic" },
    collection: { panelTint: "#0a1020" },
    deckBuilder: { workspaceTint: "#080e1a" },
  },
  SORCERY: {
    surfaces: {
      mood: "dark",
      bg: "#0f0a1a",
      bgElevated: "#1a1028",
      accent: "#a78bfa",
      accentMuted: "#5b21b6",
      heroGlow: "#7C3AED40",
      border: "#4c1d9544",
      text: "#ede9fe",
      textMuted: "#c4b5fd",
      gradientFrom: "#0f0a1a",
      gradientVia: "#2e1065",
      gradientTo: "#1e1b4b",
      cardRadius: "0.5rem",
      buttonRadius: "0.375rem",
      shadow: "0 16px 40px rgba(124,58,237,0.3)",
      texture: "none",
    },
    typography: {
      display: 'Georgia, "Palatino Linotype", serif',
      body: '"IBM Plex Sans", system-ui, sans-serif',
      tracking: "0.02em",
      displayWeight: 600,
    },
    hero: {
      animation: "fog",
      overlay: "gradient-dark",
      tagline: "Contested Realms",
      description: "Magia antiga e mapas. Sorcery no JudgeTCG.",
      ctaPrimary: "Singles",
      ctaSecondary: "Decks",
    },
    motion: DEFAULT_MOTION,
    marketplace: { skin: "realms", density: "compact" },
    collection: { panelTint: "#120a1c" },
    deckBuilder: { workspaceTint: "#0e0818" },
  },
  UARENA: {
    surfaces: {
      mood: "dark",
      bg: "#0a1224",
      bgElevated: "#122038",
      accent: "#60a5fa",
      accentMuted: "#1d4ed8",
      heroGlow: "#2563EB44",
      border: "#1e3a8a44",
      text: "#eff6ff",
      textMuted: "#93c5fd",
      gradientFrom: "#0a1224",
      gradientVia: "#1e3a8a",
      gradientTo: "#0f172a",
      cardRadius: "0.5rem",
      buttonRadius: "0.375rem",
      shadow: "0 12px 32px rgba(37,99,235,0.25)",
      texture: "none",
    },
    typography: {
      display: '"IBM Plex Sans", system-ui, sans-serif',
      body: '"IBM Plex Sans", system-ui, sans-serif',
      tracking: "0.01em",
      displayWeight: 700,
    },
    hero: {
      animation: "energy",
      overlay: "gradient-dark",
      tagline: "Arena unificada",
      description: "Animes e estratégia. Union Arena no JudgeTCG.",
      ctaPrimary: "Explorar",
      ctaSecondary: "Marketplace",
    },
    motion: DEFAULT_MOTION,
    marketplace: { skin: "arena", density: "airy" },
    collection: { panelTint: "#0c1830" },
    deckBuilder: { workspaceTint: "#0a1428" },
  },
  DBFW: {
    surfaces: {
      mood: "dark",
      bg: "#0c0806",
      bgElevated: "#1a1008",
      accent: "#fb923c",
      accentMuted: "#ea580c",
      heroGlow: "#F9731640",
      border: "#9a341244",
      text: "#fff7ed",
      textMuted: "#fdba74",
      gradientFrom: "#140c08",
      gradientVia: "#7c2d12",
      gradientTo: "#1e3a8a",
      cardRadius: "0.5rem",
      buttonRadius: "0.375rem",
      shadow: "0 0 36px rgba(249,115,22,0.35)",
      texture: "none",
    },
    typography: {
      display: '"Impact", "Arial Black", "Segoe UI", sans-serif',
      body: '"IBM Plex Sans", system-ui, sans-serif',
      tracking: "0.04em",
      displayWeight: 800,
    },
    hero: {
      animation: "aura",
      overlay: "vignette",
      tagline: "Poder além dos limites",
      description:
        "Ki, auras e explosões. Dragon Ball Fusion World com energia máxima.",
      ctaPrimary: "Power up — Singles",
      ctaSecondary: "Decks",
    },
    motion: {
      ...DEFAULT_MOTION,
      hoverGlow: "0 0 32px rgba(251,146,60,0.55)",
      hoverLift: "translateY(-5px) scale(1.03)",
    },
    marketplace: { skin: "ki", density: "cinematic" },
    collection: { panelTint: "#1a0c08" },
    deckBuilder: { workspaceTint: "#120806" },
  },
  VANGUARD: {
    surfaces: {
      mood: "dark",
      bg: "#041018",
      bgElevated: "#0a1c28",
      accent: "#67e8f9",
      accentMuted: "#0891b2",
      heroGlow: "#22D3EE40",
      border: "#155e7544",
      text: "#ecfeff",
      textMuted: "#a5f3fc",
      gradientFrom: "#06141a",
      gradientVia: "#164e63",
      gradientTo: "#0f172a",
      cardRadius: "0.5rem",
      buttonRadius: "0.375rem",
      shadow: "0 12px 32px rgba(34,211,238,0.2)",
      texture: "metal",
    },
    typography: {
      display: '"Orbitron", "Segoe UI", sans-serif',
      body: '"IBM Plex Sans", system-ui, sans-serif',
      tracking: "0.06em",
      displayWeight: 600,
    },
    hero: {
      animation: "energy",
      overlay: "neon",
      tagline: "Stand up, Vanguard!",
      description: "HUD futurista e clãs. Cardfight!! Vanguard no JudgeTCG.",
      ctaPrimary: "Singles",
      ctaSecondary: "Decks",
    },
    motion: DEFAULT_MOTION,
    marketplace: { skin: "clan", density: "compact" },
    collection: { panelTint: "#061820" },
    deckBuilder: { workspaceTint: "#041018" },
  },
};

export function getGameTheme(gameId: GameId): GameTheme {
  const token = GAME_TOKENS[gameId];
  const id = IDENTITY[gameId];
  return {
    gameId,
    ...token,
    bg: id.surfaces.bg,
    accent: id.surfaces.accent,
    heroGlow: id.surfaces.heroGlow,
    surfaces: id.surfaces,
    typography: id.typography,
    hero: id.hero,
    motion: id.motion,
    marketplace: id.marketplace,
    collection: id.collection,
    deckBuilder: id.deckBuilder,
  };
}

export function getGameThemeBySlug(slug: string): GameTheme | null {
  const id = gameIdFromSlug(slug);
  if (!id) return null;
  return getGameTheme(id);
}

/** Inline CSS variables for portal shell (SSR-safe) — Theme Engine V2. */
export function gameThemeCssVars(theme: GameTheme): CSSProperties {
  const s = theme.surfaces;
  return {
    ["--game-primary" as string]: theme.primary,
    ["--game-secondary" as string]: theme.secondary,
    ["--game-bg" as string]: s.bg,
    ["--game-bg-elevated" as string]: s.bgElevated,
    ["--game-accent" as string]: s.accent,
    ["--game-accent-muted" as string]: s.accentMuted,
    ["--game-hero-glow" as string]: s.heroGlow,
    ["--game-border" as string]: s.border,
    ["--game-text" as string]: s.text,
    ["--game-text-muted" as string]: s.textMuted,
    ["--game-gradient-from" as string]: s.gradientFrom,
    ["--game-gradient-via" as string]: s.gradientVia,
    ["--game-gradient-to" as string]: s.gradientTo,
    ["--game-card-radius" as string]: s.cardRadius,
    ["--game-button-radius" as string]: s.buttonRadius,
    ["--game-shadow" as string]: s.shadow,
    ["--game-font-display" as string]: theme.typography.display,
    ["--game-font-body" as string]: theme.typography.body,
    ["--game-tracking" as string]: theme.typography.tracking,
    ["--game-display-weight" as string]: String(theme.typography.displayWeight),
    ["--game-hover-lift" as string]: theme.motion.hoverLift,
    ["--game-hover-glow" as string]: theme.motion.hoverGlow,
    ["--game-card-transition" as string]: theme.motion.cardTransition,
    ["--game-hero-entrance" as string]: theme.motion.heroEntrance,
    ["--game-collection-tint" as string]: theme.collection.panelTint,
    ["--game-deck-tint" as string]: theme.deckBuilder.workspaceTint,
    ["--game-marketplace-skin" as string]: theme.marketplace.skin,
  };
}

export function listAllGameThemes(): GameTheme[] {
  return ALL_GAME_IDS.map(getGameTheme);
}

export type { GameId };
