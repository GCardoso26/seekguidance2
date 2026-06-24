import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Minha Coleção",
  description: "Gerencie as cartas da sua coleção no Judge TCG.",
  robots: { index: false },
};

export default function ColecaoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
