"use client";

import Link from "next/link";
import {
  Package,
  Plus,
  Search,
  Tag,
  Ticket,
  Upload,
  UserPlus,
  Zap,
} from "lucide-react";

const ACTIONS = [
  { href: "/vendedor/painel/listagens/nova", label: "Cadastrar carta", icon: Plus },
  { href: "/vendedor/painel/estoque", label: "Importar CSV", icon: Upload },
  { href: "/vendedor/painel/catalogo/produtos", label: "Produto selado", icon: Package },
  { href: "/vendedor/painel/cupons", label: "Criar cupom", icon: Tag },
  { href: "/vendedor/painel/atendimento/tickets?action=new", label: "Responder ticket", icon: Ticket },
  { href: "/vendedor/painel/equipe/usuarios", label: "Adicionar usuário", icon: UserPlus },
  { href: "/vendedor/painel/catalogo/cartas", label: "Abrir catálogo", icon: Search },
  { href: "/vendedor/painel/operacao", label: "Centro operação", icon: Zap },
] as const;

type Props = {
  sticky?: boolean;
};

export function StickyQuickActionsBar({ sticky }: Props) {
  return (
    <section
      className={`rounded-xl border border-border bg-white/[0.04] p-3 ${
        sticky ? "sticky bottom-4 z-20 shadow-lg shadow-black/20 backdrop-blur-md" : ""
      }`}
      data-testid="sticky-quick-actions"
    >
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Ações rápidas
      </h2>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {ACTIONS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex shrink-0 items-center gap-1.5 surface-card rounded-lg px-3 py-2 text-xs font-medium text-foreground transition hover:border-primary/40 hover:bg-muted"
          >
            <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
            {label}
          </Link>
        ))}
      </div>
    </section>
  );
}
