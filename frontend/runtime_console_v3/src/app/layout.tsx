import { SentryInit } from "@/components/SentryInit";

import { AuthProviderWrapper } from "@/providers/auth-provider-wrapper";

import "@/styles/globals.css";

import "@/styles/judge-tcg.css";

import { QueryProvider } from "@/providers/query-provider";

import { ThemeProvider } from "@/providers/theme-provider";

import { LuxurySiteShell } from "@/components/luxury/layout/LuxurySiteShell";
import { UpgradeModalProvider } from "@/components/premium/UpgradeModalProvider";
import { PWAInstallPrompt } from "@/components/pwa/PWAInstallPrompt";

import type { Metadata } from "next";
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
    default: "Judge TCG — Marketplace de Cartas TCG com 0% Comissão",
  },
  description:
    "Compre e venda cartas de Magic, Pokémon, Yu-Gi-Oh!, Lorcana e mais. Zero comissão, PIX direto, torneios e juízes certificados.",
  keywords: ["tcg", "cartas", "magic", "pokemon", "yugioh", "lorcana", "marketplace", "colecionáveis"],
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "Judge TCG" },
  openGraph: {
    title: "Judge TCG — Marketplace de Cartas TCG",
    description: "Zero comissão. PIX direto. Torneios e juízes certificados.",
    images: ["/og-image.jpg"],
  },
  twitter: { card: "summary_large_image" },
};



export default function RootLayout({ children }: { children: React.ReactNode }) {

  return (

    <html lang="pt-BR" className={`dark ${inter.variable}`} suppressHydrationWarning>

      <head>

        <meta name="theme-color" content="#0a0a0f" />

        <link rel="apple-touch-icon" href="/apple-icon" />

      </head>

      <body className={inter.className}>

        <SentryInit />

        <ThemeProvider>

          <AuthProviderWrapper>

            <QueryProvider>
              <UpgradeModalProvider>
                <LuxurySiteShell>{children}</LuxurySiteShell>
                <PWAInstallPrompt />
              </UpgradeModalProvider>
            </QueryProvider>

          </AuthProviderWrapper>

        </ThemeProvider>

      </body>

    </html>

  );

}

