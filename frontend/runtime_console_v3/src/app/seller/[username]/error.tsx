"use client";

import Link from "next/link";
import { MobileLayout } from "@/components/layout/MobileLayout";

export default function SellerProfileError() {
  return (
    <MobileLayout>
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-luxury-frost">Erro ao carregar loja</h1>
        <p className="mt-2 text-luxury-mist">Tente novamente em instantes.</p>
        <Link href="/loja" className="mt-6 inline-block text-luxury-gold hover:underline">
          Voltar ao marketplace
        </Link>
      </div>
    </MobileLayout>
  );
}
