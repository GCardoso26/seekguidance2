"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { planHasFeature } from "@/lib/seller-plans";

const NAV = [
  { href: "/vendedor/painel", label: "Dashboard", icon: "📊", feature: null },
  { href: "/vendedor/painel/estoque", label: "Estoque", icon: "📋", feature: null },
  { href: "/vendedor/painel/listagens", label: "Listagens", icon: "🏷️", feature: null },
  { href: "/vendedor/painel/vendas", label: "Vendas", icon: "📦", feature: null },
  { href: "/vendedor/painel/buylist", label: "BuyList", icon: "💰", feature: "buylist" },
  { href: "/vendedor/painel/clientes", label: "Clientes", icon: "👥", feature: "crm" },
  { href: "/vendedor/painel/pdv", label: "PDV", icon: "🛒", feature: "pdv" },
  { href: "/vendedor/painel/estatisticas", label: "Estatísticas", icon: "📈", feature: "analytics" },
  { href: "/vendedor/painel/planos", label: "Planos", icon: "⭐", feature: null },
  { href: "/vendedor/painel/configuracoes", label: "Configurações", icon: "⚙️", feature: null },
];

type Props = {
  sellerId?: string | null;
  storeSlug?: string | null;
  plan?: string;
  className?: string;
  onNavigate?: () => void;
};

export function Sidebar({ sellerId, storeSlug, plan = "free", className, onNavigate }: Props) {
  const publicStoreHref = storeSlug
    ? `/marketplace/loja/${storeSlug}`
    : sellerId
      ? `/vendedor/${sellerId}`
      : null;
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-white/10 bg-luxury-onyx/95 text-sm",
        className,
      )}
    >
      <div className="border-b border-white/10 p-4">
        <p className="text-xs uppercase tracking-wide text-luxury-mist">Judge TCG</p>
        <p className="font-semibold text-luxury-gold">Painel do Vendedor</p>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => {
          const locked = item.feature && !planHasFeature(plan, item.feature);
          const active =
            item.href === "/vendedor/painel"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={locked ? "/vendedor/painel/planos" : item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 transition-colors",
                active ? "bg-luxury-gold/20 text-luxury-gold" : "text-luxury-mist hover:bg-white/5",
                locked && "opacity-60",
              )}
              title={locked ? "Disponível em plano superior" : undefined}
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
              {locked && <span className="ml-auto text-xs">🔒</span>}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-1 border-t border-white/10 p-3">
        {publicStoreHref && (
          <Link
            href={publicStoreHref}
            onClick={onNavigate}
            className="block rounded-lg px-3 py-2 text-luxury-mist hover:bg-white/5"
          >
            🌐 Ver loja pública
          </Link>
        )}
        <Link
          href="/loja"
          onClick={onNavigate}
          className="block rounded-lg px-3 py-2 text-luxury-mist hover:bg-white/5"
        >
          ⬅️ Voltar ao site
        </Link>
      </div>
    </aside>
  );
}
