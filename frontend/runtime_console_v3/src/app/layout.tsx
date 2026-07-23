import { SentryInit } from "@/components/SentryInit";
import { ConsoleFilterInit } from "@/components/ConsoleFilterInit";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { MinimalProviders } from "@/providers/MinimalProviders";

/** Skip Vercel Analytics/SpeedInsights off the Vercel runtime — avoids 404/MIME console noise on local LH. */
const enableVercelTelemetry =
  process.env.VERCEL === "1" || Boolean(process.env.NEXT_PUBLIC_VERCEL_ENV);

import "@/styles/globals.css";
import "@/styles/judge-tcg.css";

import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, Source_Serif_4 } from "next/font/google";
import { brand, brandTitle } from "@/lib/brand";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans-family",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display-family",
  display: "swap",
  preload: false,
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(brand.url),
  title: {
    template: `%s | ${brand.name}`,
    default: brandTitle(),
  },
  description: brand.description,
  keywords: [
    "Magic The Gathering",
    "MTG",
    "cards",
    "loja",
    "deckbuilder",
    brand.shortName,
    "tcg",
    "pokemon",
    "yugioh",
    "lorcana",
  ],
  authors: [{ name: brand.name }],
  creator: brand.name,
  publisher: brand.name,
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: brand.shortName },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: brand.url,
    siteName: brand.name,
    title: brandTitle(),
    description: brand.description,
    images: [
      {
        url: `${brand.url}${brand.ogImagePath}`,
        width: 1200,
        height: 630,
        alt: brand.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: brand.name,
    description: brand.description,
    images: [`${brand.url}${brand.ogImagePath}`],
  },
  alternates: {
    // canonical por rota via withCanonical / generateMetadata — sem herdar "/" em filhos
  },
  icons: {
    icon: brand.faviconPath,
    apple: brand.appleIconPath,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: brand.themeColor },
    { media: "(prefers-color-scheme: dark)", color: brand.themeColorDark },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${plexSans.variable} ${sourceSerif.variable}`} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content={brand.themeColor} />
        <link rel="apple-touch-icon" href={brand.appleIconPath} />
        <link rel="preconnect" href="https://cards.scryfall.io" />
        <link rel="dns-prefetch" href="https://images.pokemontcg.io" />
        <link rel="dns-prefetch" href="https://images.ygoprodeck.com" />
        <link rel="dns-prefetch" href="https://lorcana-api.com" />
        <link rel="dns-prefetch" href="https://optcgapi.com" />
      </head>
      <body className={plexSans.className}>
        <SentryInit />
        <ConsoleFilterInit />
        <ServiceWorkerRegister />
        <MinimalProviders>{children}</MinimalProviders>
        {/* afterInteractive equivalents via package defaults — never beforeInteractive */}
        {enableVercelTelemetry ? (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        ) : null}
      </body>
    </html>
  );
}
