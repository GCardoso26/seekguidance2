"use client";

import { useState } from "react";
import Link from "next/link";
import { useCommunities } from "@/hooks/useCommunities";
import { CommunityCard } from "@/components/social/CommunityCard";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function CommunitiesPage() {
  const { data: communities = [], isLoading } = useCommunities();
  const [search, setSearch] = useState("");

  const filtered = communities.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Link href="/social" className="text-sm text-slate-400">
          ← Social
        </Link>

        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Comunidades</h1>
            <p className="mt-1 text-slate-400">Encontre grupos de jogadores</p>
          </div>
          <Button className="bg-amber-500 text-slate-900" disabled>
            Criar comunidade
          </Button>
        </div>

        <Input
          placeholder="Buscar comunidades…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mt-6 border-slate-600 bg-slate-800"
        />

        {isLoading && <p className="mt-6 text-slate-400">Carregando…</p>}

        {!isLoading && filtered.length === 0 && (
          <p className="py-12 text-center text-slate-500">Nenhuma comunidade encontrada</p>
        )}

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((community) => (
            <CommunityCard
              key={community.id}
              name={community.name}
              description={community.description}
              gameCode={community.game_code}
              memberCount={community.member_count}
            />
          ))}
        </div>
      </div>
    </MobileLayout>
  );
}
