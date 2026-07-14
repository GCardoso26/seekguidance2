import type { Metadata } from "next";
import { brand } from "@/lib/brand";

/** Metadata com canonical + og:url corretos por path (elimina SEO 92 por canonical herdado do /). */
export function withCanonical(path: string, partial: Metadata = {}): Metadata {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const url = normalized === "/" ? brand.url : `${brand.url.replace(/\/$/, "")}${normalized}`;

  return {
    ...partial,
    alternates: {
      ...partial.alternates,
      canonical: url,
    },
    openGraph: {
      ...partial.openGraph,
      url,
      siteName: brand.name,
      locale: "pt_BR",
      type: "website",
    },
  };
}
