"use client";

import Link from "next/link";
import { MobileLayout } from "@/components/layout/MobileLayout";

export default function SellerProfileError() {
  return (
    <MobileLayout>
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-foreground">Erro ao carregar loja</h1>
        <p className="mt-2 text-muted-foreground">Tente novamente em instantes.</p>
        <Link href="/loja" className="mt-6 inline-block text-primary hover:underline">
          Voltar ao marketplace
        </Link>
      </div>
    </MobileLayout>
  );
}
