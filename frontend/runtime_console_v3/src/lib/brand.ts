/**
 * Brand configuration — rebranding-ready (RC14)
 * Trocar identidade sem refatorar componentes: altere só este arquivo + env.
 * Não altera APIs nem regras de negócio.
 */

export type BrandConfig = {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  url: string;
  supportEmail: string;
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

/** Fonte única de marca para metadata, header, footer, PWA, OG. */
export const brand: BrandConfig = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME || "Judge TCG",
  shortName: process.env.NEXT_PUBLIC_BRAND_SHORT_NAME || "JudgeTCG",
  tagline:
    process.env.NEXT_PUBLIC_BRAND_TAGLINE ||
    "Loja e Deckbuilder de Magic: The Gathering",
  description:
    process.env.NEXT_PUBLIC_BRAND_DESCRIPTION ||
    "Compre cards de MTG com preços em tempo real. Monte decks, gerencie sua coleção e acompanhe o mercado. Zero comissão, PIX direto.",
  url: appUrl,
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "suporte@judgetcg.com.br",
  logoPath: process.env.NEXT_PUBLIC_BRAND_LOGO || "/brand/logo.svg",
  logoMarkPath: process.env.NEXT_PUBLIC_BRAND_MARK || "/brand/mark.svg",
  faviconPath: process.env.NEXT_PUBLIC_BRAND_FAVICON || "/favicon.ico",
  appleIconPath: process.env.NEXT_PUBLIC_BRAND_APPLE_ICON || "/apple-icon",
  ogImagePath: process.env.NEXT_PUBLIC_BRAND_OG || "/og-image.jpg",
  themeColor: process.env.NEXT_PUBLIC_BRAND_THEME || "#7c3aed",
  themeColorDark: process.env.NEXT_PUBLIC_BRAND_THEME_DARK || "#a78bfa",
  twitterHandle: process.env.NEXT_PUBLIC_BRAND_TWITTER,
};

export function brandTitle(page?: string): string {
  return page ? `${page} | ${brand.name}` : `${brand.name} — ${brand.tagline}`;
}
