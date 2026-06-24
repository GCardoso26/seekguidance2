import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Loja de cartas TCG",
  description: "Explore todos os jogos de cartas disponíveis no Judge TCG.",
};

export default function LojaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
