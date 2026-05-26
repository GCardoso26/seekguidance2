import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TCG Judge — Consulta de Regras",
  description: "Assistente de regras oficiais para TCG",
};

export default function JudgeRouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
