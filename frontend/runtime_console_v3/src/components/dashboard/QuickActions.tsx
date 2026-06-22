import Link from "next/link";

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-2">
      <Link href="/store/dashboard?tab=products" className="rounded-lg bg-luxury-gold px-4 py-2 text-sm font-semibold text-luxury-onyx">
        Novo produto
      </Link>
      <Link href="/store/dashboard" className="rounded-lg border border-white/20 px-4 py-2 text-sm">
        Ver pedidos
      </Link>
      <Link href="/store/dashboard?tab=pagamentos" className="rounded-lg border border-white/20 px-4 py-2 text-sm">
        Configurar PIX
      </Link>
      <Link href="/store/listings" className="rounded-lg border border-white/20 px-4 py-2 text-sm">
        Listagens de cartas
      </Link>
    </div>
  );
}
