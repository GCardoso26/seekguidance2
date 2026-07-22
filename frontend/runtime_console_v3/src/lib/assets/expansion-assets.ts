/**
 * Expansion / set visual assets — fed by Asset Service entity catalog_set when available;
 * falls back to game logo / theme hero until ingest completes.
 */
export type ExpansionAssetPack = {
  logo?: string | null;
  banner?: string | null;
  background?: string | null;
  keyArt?: string | null;
  wallpaper?: string | null;
  icon?: string | null;
};

export function resolveExpansionAssets(input: {
  setAssets?: ExpansionAssetPack | null;
  gameLogo?: string | null;
  heroFallback?: string | null;
}): Required<ExpansionAssetPack> {
  const a = input.setAssets ?? {};
  const logo = a.logo || a.icon || input.gameLogo || null;
  const keyArt = a.keyArt || a.banner || a.background || input.heroFallback || logo;
  return {
    logo,
    banner: a.banner || keyArt,
    background: a.background || a.wallpaper || keyArt,
    keyArt,
    wallpaper: a.wallpaper || a.background || keyArt,
    icon: a.icon || logo,
  };
}

export type DeckCoverAssets = {
  cover?: string | null;
  customCover?: string | null;
  banner?: string | null;
  thumb?: string | null;
  share?: string | null;
  autoFromCard?: string | null;
};

export function resolveDeckCover(assets: DeckCoverAssets, fallbackLogo?: string | null) {
  const cover = assets.customCover || assets.cover || assets.autoFromCard || fallbackLogo || null;
  return {
    cover,
    banner: assets.banner || cover,
    thumb: assets.thumb || cover,
    share: assets.share || cover,
  };
}
