"use client";

import Link from "next/link";

type Props = {
  displayName?: string;
  action?: React.ReactNode;
};

export function SellerHeader({ displayName, action }: Props) {
  const greeting = displayName ? `Olá, ${displayName}!` : "Painel do vendedor";

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-luxury-onyx/60 px-6 py-4">
      <div>
        <h1 className="text-lg font-semibold">{greeting}</h1>
        <p className="text-xs text-luxury-mist">Gerencie listagens, vendas e configurações</p>
      </div>
      {action ?? (
        <Link
          href="/vendedor/painel/listagens/nova"
          className="rounded-full bg-luxury-gold px-4 py-2 text-sm font-semibold text-luxury-onyx"
        >
          + Nova listagem
        </Link>
      )}
    </header>
  );
}
