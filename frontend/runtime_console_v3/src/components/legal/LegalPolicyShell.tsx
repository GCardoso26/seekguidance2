import Link from "next/link";
import type { ReactNode } from "react";
import { brand } from "@/lib/brand";

export function LegalPolicyShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-2xl px-4 pb-24 pt-8">
      <p className="mb-4 text-small font-medium uppercase tracking-wide text-primary">Políticas</p>
      <h1 className="mb-6 text-h1 text-foreground">{title}</h1>
      <p className="mb-6 text-small text-muted-foreground">
        Operador: {brand.legalName}
        {brand.cnpj ? ` · CNPJ ${brand.cnpj}` : ""} · Contato: {brand.supportEmail}
      </p>
      <div className="space-y-6 text-body leading-relaxed text-muted-foreground">{children}</div>
      <p className="mt-10 flex flex-wrap gap-4 text-small">
        <Link href="/termos" className="text-primary underline">
          Termos
        </Link>
        <Link href="/privacidade" className="text-primary underline">
          Privacidade
        </Link>
        <Link href="/loja" className="text-primary underline">
          Voltar à loja
        </Link>
      </p>
    </article>
  );
}
