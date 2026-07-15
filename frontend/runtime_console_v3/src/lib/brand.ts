/**
 * Brand — trust-facing fields (BP 5.2).
 * Não inventar CNPJ/endereço: produção deve setar env. Ausência = P0 de confiança.
 */
export type BrandConfig = {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  url: string;
  supportEmail: string;
  legalName: string;
  cnpj: string;
  /** Endereço completo para rodapé/legal (vazio = P0) */
  legalAddress: string;
  logoPath: string;
  logoMarkPath: string;
  faviconPath: string;
  appleIconPath: string;
  ogImagePath: string;
  themeColor: string;
  themeColorDark: string;
  twitterHandle?: string;
};

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://judgetcg.com.br";

export const brand: BrandConfig = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME || "Judge TCG",
  shortName: process.env.NEXT_PUBLIC_BRAND_SHORT_NAME || "JudgeTCG",
  tagline:
    process.env.NEXT_PUBLIC_BRAND_TAGLINE ||
    "Loja onde lojas especializadas vendem cartas de Pokémon, Magic, Lorcana e outros jogos",
  description:
    process.env.NEXT_PUBLIC_BRAND_DESCRIPTION ||
    "Compare ofertas de lojas, veja o estado da carta, calcule o frete no carrinho e pague com PIX ou cartão.",
  url: appUrl,
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "suporte@judgetcg.com.br",
  legalName: process.env.NEXT_PUBLIC_LEGAL_NAME || "Judge TCG",
  cnpj: process.env.NEXT_PUBLIC_CNPJ || "",
  legalAddress: process.env.NEXT_PUBLIC_LEGAL_ADDRESS || "",
  logoPath: process.env.NEXT_PUBLIC_BRAND_LOGO || "/brand/logo.svg",
  logoMarkPath: process.env.NEXT_PUBLIC_BRAND_MARK || "/brand/mark.svg",
  faviconPath: process.env.NEXT_PUBLIC_BRAND_FAVICON || "/icon",
  appleIconPath: process.env.NEXT_PUBLIC_BRAND_APPLE_ICON || "/apple-icon",
  ogImagePath: process.env.NEXT_PUBLIC_BRAND_OG || "/og-image.jpg",
  themeColor: process.env.NEXT_PUBLIC_BRAND_THEME || "#243a52",
  themeColorDark: process.env.NEXT_PUBLIC_BRAND_THEME_DARK || "#7a9bb8",
  twitterHandle: process.env.NEXT_PUBLIC_BRAND_TWITTER,
};

export function brandTitle(page?: string): string {
  return page ? `${page} | ${brand.name}` : `${brand.name} — ${brand.tagline}`;
}

/** CNPJ só com zeros / vazio = placeholder — não conta como face legal (BP 5.2). */
export function brandCnpjIsPlaceholder(): boolean {
  const digits = brand.cnpj.replace(/\D/g, "");
  return digits.length === 0 || /^0+$/.test(digits);
}

/**
 * True quando razão social + CNPJ + endereço estão publicados
 * e o CNPJ não é placeholder (ex.: 00.000.000/0000-00).
 */
export function brandHasLegalTransparency(): boolean {
  return Boolean(
    brand.cnpj.trim() &&
      brand.legalAddress.trim() &&
      brand.legalName.trim() &&
      !brandCnpjIsPlaceholder(),
  );
}
