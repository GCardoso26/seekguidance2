"use client";

import Link from "next/link";
import { Scale } from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";

export default function RegrasPage() {
  return (
    <MobileLayout>
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <div className="flex items-center gap-3">
          <Scale className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Regras & Rulings</h1>
        </div>
        <p className="mt-4 text-muted-foreground">
          Diferencial Judge-TCG: consulte regras oficiais e obtenha rulings com fontes verificadas para
          Magic, Pokémon, Yu-Gi-Oh! e outros TCGs.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/judge">Abrir assistente de juiz</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/loja/busca">Buscar carta com regras</Link>
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
}
