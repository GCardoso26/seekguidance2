import { SentryInit } from "@/components/SentryInit";

import { AuthProviderWrapper } from "@/providers/auth-provider-wrapper";

import "@/styles/globals.css";

import "@/styles/judge-tcg.css";

import { QueryProvider } from "@/providers/query-provider";

import { ThemeProvider } from "@/providers/theme-provider";

import type { Metadata } from "next";

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

    <html lang="pt-BR" className="dark" suppressHydrationWarning>

      <head>

        <meta name="theme-color" content="#0f172a" />

        <link rel="apple-touch-icon" href="/icon-192x192.png" />

      </head>

      <body>

        <SentryInit />

        <ThemeProvider>

          <AuthProviderWrapper>

            <QueryProvider>{children}</QueryProvider>

          </AuthProviderWrapper>

        </ThemeProvider>

      </body>

    </html>

  );

}

