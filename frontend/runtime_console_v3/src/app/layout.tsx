import { SearchPlatformProvider } from "@/features/search/SearchPlatformContext";
import { SentryInit } from "@/components/SentryInit";
import { ConsoleFilterInit } from "@/components/ConsoleFilterInit";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { AuthProviderWrapper } from "@/providers/auth-provider-wrapper";

import "@/styles/globals.css";

import "@/styles/judge-tcg.css";

import { QueryProvider } from "@/providers/query-provider";

import { ThemeProvider } from "@/providers/theme-provider";

import { LuxurySiteShell } from "@/components/luxury/layout/LuxurySiteShell";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { CartProvider } from "@/components/cart/CartProvider";
import { UpgradeModalProvider } from "@/components/premium/UpgradeModalProvider";
import { PWAInstallPrompt } from "@/components/pwa/PWAInstallPrompt";
import { Toaster } from "sonner";

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { brand, brandTitle } from "@/lib/brand";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
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
    canonical: brand.url,
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
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content={brand.themeColor} />

        <link rel="apple-touch-icon" href={brand.appleIconPath} />

        <link rel="preconnect" href="https://cards.scryfall.io" />
        <link rel="preconnect" href="https://images.pokemontcg.io" />
        <link rel="preconnect" href="https://images.ygoprodeck.com" />
        <link rel="dns-prefetch" href="https://lorcana-api.com" />
        <link rel="dns-prefetch" href="https://optcgapi.com" />

      </head>

      <body className={inter.className}>

        <SentryInit />
        <ConsoleFilterInit />
        <ServiceWorkerRegister />

        <ThemeProvider>

          <AuthProviderWrapper>

            <QueryProvider>
              <UpgradeModalProvider>
                <CartProvider>
                  <ErrorBoundary>
                    <SearchPlatformProvider>
                      <LuxurySiteShell>{children}</LuxurySiteShell>
                    </SearchPlatformProvider>
                  </ErrorBoundary>
                  <PWAInstallPrompt />
                </CartProvider>
              </UpgradeModalProvider>
            </QueryProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                classNames: {
                  toast: "bg-card border border-border text-foreground shadow-md",
                },
              }}
            />

          </AuthProviderWrapper>

        </ThemeProvider>

        <Analytics />
        <SpeedInsights />

      </body>

    </html>

  );

}

