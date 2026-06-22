"use client";

import Link from "next/link";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { TopMoversPlaceholder } from "@/components/trends/TopMoversPlaceholder";

export default function LojaTendenciasPage() {
  return (
    <MobileLayout>
      <div className="container mx-auto px-4 py-8">
        <Link href="/loja/busca" className="text-sm text-muted-foreground">
          ← Loja
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Tendências do dia</h1>
        <p className="mt-1 text-sm text-muted-foreground">Cartas com maior variação de preço.</p>
        <div className="mt-8">
          <TopMoversPlaceholder />
        </div>
      </div>
    </MobileLayout>
  );
}
