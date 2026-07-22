"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CollectionFilters } from "@/components/collection/CollectionFilters";
import { CollectionGrid } from "@/components/collection/CollectionGrid";
import { CollectionImportCsv } from "@/components/collection/CollectionImportCsv";
import { EditCollectionItemModal } from "@/components/collection/EditCollectionItemModal";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import {
  useRemoveCollectionItem,
  useUserCollection,
  type CollectionItem,
} from "@/hooks/useDeck";
import { filterCollectionItems, sortCollectionItems, type CollectionSort } from "@/lib/collection";

export default function ColecaoCartasPage() {
  const { user, loading } = useJudgeAuth();
  const { data: items = [], isLoading } = useUserCollection();
  const removeItem = useRemoveCollectionItem();

  const [q, setQ] = useState("");
  const [game, setGame] = useState("");
  const [condition, setCondition] = useState("");
  const [foil, setFoil] = useState("");
  const [sort, setSort] = useState<CollectionSort>("name");
  const [editing, setEditing] = useState<CollectionItem | null>(null);

  const filtered = useMemo(() => {
    const foilFilter = foil === "foil" ? true : foil === "normal" ? false : null;
    return sortCollectionItems(
      filterCollectionItems(items, { q, game, condition, foil: foilFilter }),
      sort,
    );
  }, [items, q, game, condition, foil, sort]);

  if (!loading && !user) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">Cartas da coleção</h1>
        <p className="mt-2 text-sm text-muted-foreground">Entre para gerenciar suas cartas.</p>
        <Link
          href="/entrar?next=/colecao/cartas"
          className="mt-6 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Entrar
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="collection-cartas-page">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Todas as cartas</h1>
          <p className="text-sm text-muted-foreground">Filtros, importação e edição</p>
        </div>
        <Link href="/loja/busca" className="text-sm text-primary hover:underline">
          + Adicionar cartas
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <p className="rounded-xl border border-border/70 bg-card/40 p-4 text-sm text-muted-foreground">
          Gerencie quantidade e condição. Integre com{" "}
          <Link href="/colecao/wishlist" className="text-primary hover:underline">
            wishlist
          </Link>{" "}
          e{" "}
          <Link href="/decks" className="text-primary hover:underline">
            decks
          </Link>
          .
        </p>
        <CollectionImportCsv />
      </div>

      <CollectionFilters
        q={q}
        game={game}
        condition={condition}
        foil={foil}
        sort={sort}
        onQChange={setQ}
        onGameChange={setGame}
        onConditionChange={setCondition}
        onFoilChange={setFoil}
        onSortChange={setSort}
      />

      {isLoading && <p className="text-sm text-muted-foreground">Carregando coleção…</p>}
      {!isLoading && (
        <CollectionGrid
          items={filtered}
          onEdit={setEditing}
          onRemove={(id) => removeItem.mutate(id)}
          busy={removeItem.isPending}
        />
      )}

      <EditCollectionItemModal item={editing} onClose={() => setEditing(null)} />
    </div>
  );
}
