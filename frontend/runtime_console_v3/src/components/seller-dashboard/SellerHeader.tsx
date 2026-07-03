"use client";

import Link from "next/link";

type Props = {
  displayName?: string;
  subtitle?: string;
  action?: React.ReactNode;
};

export function SellerHeader({ displayName, subtitle, action }: Props) {
  const greeting = displayName ?? "Painel do vendedor";

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-luxury-onyx/60 px-6 py-4">
      <div>
        <h1 className="text-lg font-semibold">{greeting}</h1>
        <p className="text-xs text-luxury-mist">
          {subtitle ?? "Gerencie listagens, pedidos e configurações"}
        </p>
      </div>
      {action ?? (
        <Link
          href="/vendedor/painel/catalogo/cartas?action=new"
          className="rounded-full bg-luxury-gold px-4 py-2 text-sm font-semibold text-luxury-onyx"
        >
          + Novo anúncio
        </Link>
      )}
    </header>
  );
}
