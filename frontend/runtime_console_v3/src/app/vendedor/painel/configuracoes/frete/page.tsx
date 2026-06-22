"use client";

import Link from "next/link";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";

export default function FreteConfigPage() {
  return (
    <>
      <SellerHeader action={null} />
      <main className="flex-1 space-y-4 overflow-y-auto p-6">
        <h2 className="text-xl font-bold">Frete</h2>
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <p className="text-luxury-mist">
            Políticas de frete avançadas estarão disponíveis em breve. Por enquanto, combine o envio
            diretamente com o comprador após a venda.
          </p>
          <Link href="/vendedor/painel/configuracoes" className="mt-4 inline-block text-sm text-luxury-gold underline">
            ← Voltar às configurações
          </Link>
        </div>
      </main>
    </>
  );
}
