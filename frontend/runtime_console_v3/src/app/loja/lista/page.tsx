"use client";

import Link from "next/link";
import { MobileLayout } from "@/components/layout/MobileLayout";

export default function LojaListaPage() {
  return (
    <MobileLayout>
      <div className="container mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Compra por lista</h1>
        <p className="mt-4 text-muted-foreground">
          Cole uma lista de cartas (formato .dec ou texto) para encontrar ofertas em lote. Em breve.
        </p>
        <Link href="/loja/busca" className="mt-8 inline-block text-primary hover:underline">
          Buscar cartas individualmente →
        </Link>
      </div>
    </MobileLayout>
  );
}
