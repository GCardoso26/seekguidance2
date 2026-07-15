"use client";

import Link from "next/link";
import { Plus, Upload } from "lucide-react";

/** BP 5.1 — One screen / one goal: só ações de estoque no horário de pico. */
const ACTIONS = [
  { href: "/vendedor/painel/listagens/nova", label: "Cadastrar carta", icon: Plus },
  { href: "/vendedor/painel/estoque", label: "Importar CSV", icon: Upload },
] as const;

type Props = {
  sticky?: boolean;
};

export function StickyQuickActionsBar({ sticky }: Props) {
  return (
    <section
      className={`rounded-lg border border-border bg-card p-3 ${
        sticky ? "sticky bottom-4 z-20" : ""
      }`}
      data-testid="sticky-quick-actions"
    >
      <h2 className="mb-2 text-small font-semibold text-muted-foreground">Estoques</h2>
      <div className="flex gap-2">
        {ACTIONS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border bg-background px-3 py-2.5 text-small font-medium text-foreground hover:border-primary/40"
          >
            <Icon className="h-4 w-4 text-primary" aria-hidden />
            {label}
          </Link>
        ))}
      </div>
    </section>
  );
}
