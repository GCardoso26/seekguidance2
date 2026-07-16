"use client";

import { useSearchParams } from "next/navigation";
import { SearchForm } from "@/src/components/buyer/SearchForm";
import { SearchResultList } from "@/src/components/buyer/SearchResultList";
import { useSearchCards } from "@/src/hooks";
import { EmptyState, ErrorState, Loading } from "@/src/components/ui";

export function SearchPageClient() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const query = useSearchCards({ q, limit: 20 }, q.trim().length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-3 text-2xl font-semibold text-zinc-900">Buscar cartas</h1>
        <SearchForm initialQuery={q} autoFocus={!q} />
      </div>

      {!q.trim() ? (
        <EmptyState
          title="Digite o nome de uma carta"
          description="Resultados vêm do catálogo oficial — sem dados de loja nesta lista."
        />
      ) : null}

      {q.trim() && query.isPending ? <Loading label="Buscando…" /> : null}

      {q.trim() && query.isError ? (
        <ErrorState
          title="Não foi possível buscar"
          description="Tente novamente em instantes."
        />
      ) : null}

      {q.trim() && query.isSuccess && query.data.hits.length === 0 ? (
        <EmptyState
          title="Nenhuma carta encontrada"
          description={`Sem resultados para «${q}».`}
        />
      ) : null}

      {q.trim() && query.isSuccess && query.data.hits.length > 0 ? (
        <div>
          <p className="mb-2 text-sm text-zinc-500">
            {query.data.estimatedTotal} resultado(s) · catálogo
          </p>
          <SearchResultList cards={query.data.hits.map((h) => h.card)} />
        </div>
      ) : null}
    </div>
  );
}
