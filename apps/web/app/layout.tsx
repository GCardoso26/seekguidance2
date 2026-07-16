import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/src/providers/app-providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JudgeTCG",
  description: "Busque cartas oficiais e compare ofertas de lojas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-zinc-50 antialiased`}>
        <AppProviders>
          <header className="border-b border-zinc-200 bg-white">
            <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
              <Link href="/" className="text-lg font-semibold tracking-tight text-zinc-900">
                JudgeTCG
              </Link>
              <nav className="flex gap-3 text-sm text-zinc-700">
                <Link href="/search" className="hover:text-emerald-800">
                  Buscar
                </Link>
                <Link href="/cart" className="hover:text-emerald-800">
                  Carrinho
                </Link>
                <Link href="/login" className="hover:text-emerald-800">
                  Entrar
                </Link>
                <Link href="/register" className="hover:text-emerald-800">
                  Criar conta
                </Link>
                <Link href="/seller" className="hover:text-emerald-800">
                  Seller
                </Link>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
        </AppProviders>
      </body>
    </html>
  );
}
