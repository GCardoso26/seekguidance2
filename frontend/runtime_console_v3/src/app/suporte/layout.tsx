import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Suporte",
  description: "Fale com a equipe Judge TCG — dúvidas sobre conta, KYC e painel do lojista.",
};

export default function SuporteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
