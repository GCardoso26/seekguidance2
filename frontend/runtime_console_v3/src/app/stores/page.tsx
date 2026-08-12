"use client";

import { useState } from "react";
import Link from "next/link";
import { useStores } from "@/hooks/useStores";
import { StoreCard } from "@/components/stores/StoreCard";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function StoresPage() {
  const [search, setSearch] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const { data, isLoading } = useStores({ search, verified: verifiedOnly || undefined });

  return (
    <MobileLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/" className="text-sm text-muted-foreground">
              ← Início
            </Link>
            <h1 className="mt-2 text-3xl font-bold">Lojas TCG</h1>
            <p className="mt-1 text-muted-foreground">Encontre lojas verificadas para jogar</p>
          </div>
          <Link href="/vender">
            <Button className="bg-primary text-primary-foreground hover:opacity-90">
              Vender no JudgeTCG
            </Button>
          </Link>
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Buscar lojas…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-border bg-muted/50"
          />
          <Button
            type="button"
            variant={verifiedOnly ? "default" : "outline"}
            onClick={() => setVerifiedOnly((v) => !v)}
            className="border-border"
          >
            {verifiedOnly ? "Só verificadas ✓" : "Filtrar verificadas"}
          </Button>
        </div>

        {isLoading && <p className="text-muted-foreground">Carregando lojas…</p>}

        {!isLoading && (data?.stores.length ?? 0) === 0 && (
          <p className="py-12 text-center text-muted-foreground/70">Nenhuma loja encontrada</p>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data?.stores.map((store) => (
            <StoreCard
              key={store.id}
              slug={store.slug}
              name={store.name}
              city={store.city}
              averageRating={store.average_rating}
              reviewCount={store.review_count}
              verified={store.verified ?? store.verification_status === "verified"}
              trustTier={store.trust_tier}
            />
          ))}
        </div>
      </div>
    </MobileLayout>
  );
}
