"use client";

import Link from "next/link";
import type { AccreditationApplication } from "@/lib/seller-accreditation";

type Props = {
  application: AccreditationApplication;
};

export function AccreditationStatusView({ application }: Props) {
  const protocol = application.protocol || "—";
  const checklist = application.checklist || [];

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
        Credenciamento
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Sua loja está em análise</h1>
      <p className="mt-2 inline-flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-1.5 text-sm">
        <span aria-hidden>🟡</span> Em análise
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        Solicitação: <span className="font-medium text-foreground">{protocol}</span>
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Você não precisa fazer mais nada agora. Avisaremos quando a análise avançar.
      </p>

      <ol className="mt-10 space-y-3">
        {checklist.map((item) => {
          const done = item.state === "done";
          const current = item.state === "current";
          return (
            <li
              key={item.id}
              className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm ${
                current
                  ? "border-primary/40 bg-primary/5"
                  : done
                    ? "border-border bg-card/40"
                    : "border-border/60 text-muted-foreground"
              }`}
            >
              <span className="mt-0.5 w-5 shrink-0 text-center" aria-hidden>
                {done ? "✓" : current ? "●" : "○"}
              </span>
              <span className={done || current ? "text-foreground" : undefined}>{item.label}</span>
            </li>
          );
        })}
      </ol>

      <div className="mt-10 flex flex-wrap gap-3 text-sm">
        <Link href="/vender" className="text-primary underline-offset-2 hover:underline">
          Voltar à página Vender
        </Link>
        <Link href="/" className="text-muted-foreground underline-offset-2 hover:underline">
          Ir ao início
        </Link>
      </div>
    </div>
  );
}
