"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { CollectionFilters } from "@/components/collection/CollectionFilters";
import { CollectionGrid } from "@/components/collection/CollectionGrid";
import { CollectionStats } from "@/components/collection/CollectionStats";
import { EditCollectionItemModal } from "@/components/collection/EditCollectionItemModal";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import {
  useRemoveCollectionItem,
  useUserCollection,
  type CollectionItem,
} from "@/hooks/useDeck";
import { filterCollectionItems, sortCollectionItems, type CollectionSort } from "@/lib/collection";

export default function ColecaoPage() {
  const router = useRouter();
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
    router.push("/login?next=/perfil/colecao");
    return null;
  }

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-luxury-frost">Minha Coleção</h1>
            <p className="text-sm text-luxury-mist">Gerencie as cartas que você possui</p>
          </div>
          <Link href="/loja/busca" className="text-sm text-luxury-gold">
            + Adicionar cartas
          </Link>
        </div>

        <div className="mt-6">
          <CollectionStats items={items} />
        </div>

        <div className="mt-6">
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
        </div>

        <div className="mt-6">
          {isLoading && <p className="text-sm text-luxury-mist">Carregando coleção…</p>}
          {!isLoading && (
            <CollectionGrid
              items={filtered}
              onEdit={setEditing}
              onRemove={(id) => removeItem.mutate(id)}
              busy={removeItem.isPending}
            />
          )}
        </div>
      </div>

      <EditCollectionItemModal item={editing} onClose={() => setEditing(null)} />
    </MobileLayout>
  );
}
