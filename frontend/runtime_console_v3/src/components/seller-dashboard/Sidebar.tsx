"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/vendedor/painel", label: "Dashboard", icon: "📊" },
  { href: "/vendedor/painel/listagens", label: "Listagens", icon: "🏷️" },
  { href: "/vendedor/painel/vendas", label: "Vendas", icon: "📦" },
  { href: "/vendedor/painel/estatisticas", label: "Estatísticas", icon: "📈" },
  { href: "/vendedor/painel/configuracoes", label: "Configurações", icon: "⚙️" },
];

type Props = {
  sellerId?: string | null;
  className?: string;
  onNavigate?: () => void;
};

export function Sidebar({ sellerId, className, onNavigate }: Props) {
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
          const active =
            item.href === "/vendedor/painel"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 transition-colors",
                active ? "bg-luxury-gold/20 text-luxury-gold" : "text-luxury-mist hover:bg-white/5",
              )}
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-1 border-t border-white/10 p-3">
        {sellerId && (
          <Link
            href={`/vendedor/${sellerId}`}
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
