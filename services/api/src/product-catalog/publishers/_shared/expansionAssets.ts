/**
 * Expansion assets — logo/banner/hero/key art/etc via existing Asset Pipeline entity catalog_set.
 * No parallel storage.
 */

export const EXPANSION_ASSET_ROLES = [
  "logo",
  "banner",
  "background",
  "hero",
  "key_art",
  "pack_art",
  "icon",
  "wallpaper",
] as const;

export type ExpansionAssetRole = (typeof EXPANSION_ASSET_ROLES)[number];

export interface ExpansionAssetDTO {
  game: string;
  expansionCode: string;
  expansionName: string;
  role: ExpansionAssetRole;
  sourceUrl: string;
  providerId: string;
}

export interface ExpansionAssetProvider {
  readonly providerId: string;
  readonly game: string;
  syncExpansionAssets(): Promise<ExpansionAssetDTO[]>;
}

export function mapSetImagesToExpansionAssets(input: {
  game: string;
  providerId: string;
  code: string;
  name: string;
  logo?: string;
  banner?: string;
  background?: string;
  hero?: string;
  keyArt?: string;
  packArt?: string;
  icon?: string;
  wallpaper?: string;
  symbol?: string;
}): ExpansionAssetDTO[] {
  const out: ExpansionAssetDTO[] = [];
  const push = (role: ExpansionAssetRole, url?: string) => {
    if (!url) return;
    out.push({
      game: input.game,
      expansionCode: input.code,
      expansionName: input.name,
      role,
      sourceUrl: url,
      providerId: input.providerId,
    });
  };
  push("logo", input.logo);
  push("banner", input.banner);
  push("background", input.background);
  push("hero", input.hero);
  push("key_art", input.keyArt);
  push("pack_art", input.packArt);
  push("icon", input.icon ?? input.symbol);
  push("wallpaper", input.wallpaper);
  return out;
}
