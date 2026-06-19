import { SentryInit } from "@/components/SentryInit";

import { AuthProviderWrapper } from "@/providers/auth-provider-wrapper";

import "@/styles/globals.css";

import "@/styles/judge-tcg.css";

import { QueryProvider } from "@/providers/query-provider";

import { ThemeProvider } from "@/providers/theme-provider";

import { LuxurySiteShell } from "@/components/luxury/layout/LuxurySiteShell";
import { UpgradeModalProvider } from "@/components/premium/UpgradeModalProvider";

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
  title: "Judge TCG",
  description: "Plataforma de torneios TCG",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "Judge TCG" },
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
              </UpgradeModalProvider>
            </QueryProvider>

          </AuthProviderWrapper>

        </ThemeProvider>

      </body>

    </html>

  );

}

