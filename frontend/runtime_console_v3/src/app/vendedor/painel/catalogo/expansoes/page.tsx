"use client";

import { useState } from "react";
import { PageHeader, PageShell } from "@/components/seller-dashboard/PageShell";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { GameSelectorTabs } from "@/components/seller-catalog/GameSelectorTabs";
import { useCatalogExpansions } from "@/hooks/useCatalogCards";

export default function CatalogoExpansoesPage() {
  const [game, setGame] = useState("mtg");
  const { data, isLoading, refetch } = useCatalogExpansions(game);

  async function importSet(setCode: string) {
    try {
      const res = await fetch(
        `/api/seller/catalog/expansions/${encodeURIComponent(setCode)}/import?game=${encodeURIComponent(game)}`,
        { method: "POST" },
      );
      if (!res.ok) throw new Error("fail");
      await refetch();
    } catch {
      /* fallback silencioso em dev sem API */
    }
  }

  return (
    <>
      <SellerHeader action={null} />
      <PageShell>
        <PageHeader title="Expansões" description="Sets por jogo — importe cards em massa." />
        <GameSelectorTabs activeSlug={game} onChange={setGame} />
        {isLoading ? (
          <p className="text-sm text-luxury-mist">Carregando…</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-left text-luxury-mist">
                <tr>
                  <th className="p-3">Expansão</th>
                  <th className="p-3">Sigla</th>
                  <th className="p-3">Lançamento</th>
                  <th className="p-3">Cards total</th>
                  <th className="p-3">Minhas</th>
                  <th className="p-3">Ação</th>
                </tr>
              </thead>
              <tbody>
                {(data?.expansions ?? []).map((exp) => (
                  <tr key={String(exp.code)} className="border-t border-white/10">
                    <td className="p-3">{String(exp.name)}</td>
                    <td className="p-3 font-mono">{String(exp.code)}</td>
                    <td className="p-3">{String(exp.release_date ?? "—")}</td>
                    <td className="p-3">{String(exp.catalog_card_count ?? exp.card_count ?? "—")}</td>
                    <td className="p-3">
                      {String(exp.store_listings_count ?? 0)}/
                      {String(exp.catalog_card_count ?? exp.card_count ?? "?")}
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => void importSet(String(exp.code))}
                        className="text-xs text-luxury-gold underline"
                      >
                        Importar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageShell>
    </>
  );
}
