import { CommandPalette } from "@/components/search/CommandPalette";
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

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://judgetcg.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    template: "%s | Judge TCG",
    default: "Judge TCG — Loja e Deckbuilder de Magic: The Gathering",
  },
  description:
    "Compre cards de MTG com preços em tempo real. Monte decks, gerencie sua coleção e acompanhe o mercado. Zero comissão, PIX direto.",
  keywords: [
    "Magic The Gathering",
    "MTG",
    "cards",
    "loja",
    "deckbuilder",
    "Judge TCG",
    "tcg",
    "pokemon",
    "yugioh",
    "lorcana",
  ],
  authors: [{ name: "Judge TCG" }],
  creator: "Judge TCG",
  publisher: "Judge TCG",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "Judge TCG" },
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
    url: appUrl,
    siteName: "Judge TCG",
    title: "Judge TCG — Loja e Deckbuilder de Magic: The Gathering",
    description: "Compre cards de MTG com preços em tempo real.",
    images: [
      {
        url: `${appUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "Judge TCG — Loja de Magic: The Gathering",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Judge TCG",
    description: "Compre cards de MTG com preços em tempo real.",
    images: [`${appUrl}/og-image.jpg`],
  },
  alternates: {
    canonical: appUrl,
  },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};



export default function RootLayout({ children }: { children: React.ReactNode }) {

  return (

    <html lang="pt-BR" className={`dark ${inter.variable}`} suppressHydrationWarning>

      <head>

        <meta name="theme-color" content="#7c3aed" />

        <link rel="apple-touch-icon" href="/apple-icon" />

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
                    <LuxurySiteShell>{children}</LuxurySiteShell>
                    <CommandPalette />
                  </ErrorBoundary>
                  <PWAInstallPrompt />
                </CartProvider>
              </UpgradeModalProvider>
            </QueryProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                classNames: {
                  toast: "bg-zinc-900 border border-zinc-800 text-white",
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

