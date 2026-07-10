import Link from "next/link";

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/vendedor/painel/listagens/nova"
        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        Novo produto
      </Link>
      <Link href="/vendedor/painel/vendas" className="rounded-lg border border-border px-4 py-2 text-sm">
        Ver pedidos
      </Link>
      <Link
        href="/vendedor/painel/configuracoes/pagamentos"
        className="rounded-lg border border-border px-4 py-2 text-sm"
      >
        Configurar PIX
      </Link>
      <Link href="/vendedor/painel/listagens" className="rounded-lg border border-border px-4 py-2 text-sm">
        Listagens de cartas
      </Link>
    </div>
  );
}
