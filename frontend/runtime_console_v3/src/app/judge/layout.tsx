import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const title = "Judge TCG — Consulta de Regras Oficiais";
const description =
  "Assistente de regras oficiais para TCG. Magic, Pokémon, Yu-Gi-Oh!, Flesh and Blood, Digimon e mais — respostas em português com fontes indexadas.";

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://judgetcg.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    locale: "pt_BR",
    siteName: "Judge TCG",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function JudgeRouteLayout({ children }: { children: React.ReactNode }) {
  return <div className={plusJakarta.className}>{children}</div>;
}
