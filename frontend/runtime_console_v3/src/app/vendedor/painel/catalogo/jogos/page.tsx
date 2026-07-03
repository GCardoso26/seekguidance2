"use client";

import { PageHeader, PageShell } from "@/components/seller-dashboard/PageShell";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { useCatalogGames } from "@/hooks/useCatalogCards";
import { getTcgBrand } from "@/lib/tcg-brand";
import type { TcgType } from "@/types/judge";

export default function CatalogoJogosPage() {
  const { data, isLoading } = useCatalogGames();

  return (
    <>
      <SellerHeader action={null} />
      <PageShell>
        <PageHeader
          title="Jogos"
          description="TCGs suportados — configuração gerenciada pela plataforma."
        />
        {isLoading ? (
          <p className="text-sm text-luxury-mist">Carregando…</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(data?.games ?? []).map((game) => {
              const slug = String(game.slug ?? "magic");
              let brand;
              try {
                brand = getTcgBrand(slug as TcgType);
              } catch {
                brand = null;
              }
              const cfg = (game.config ?? {}) as Record<string, unknown>;
              return (
                <article
                  key={String(game.id)}
                  className="rounded-xl border border-white/10 bg-white/5 p-4"
                  style={
                    brand
                      ? { borderColor: `${brand.accent}40` }
                      : undefined
                  }
                >
                  <p className="text-lg font-semibold">{String(game.display_name ?? game.name)}</p>
                  <p className="text-xs text-luxury-mist">{String(game.game_code)}</p>
                  <p className="mt-2 text-xs text-luxury-mist">
                    Condições: {((cfg.conditions as string[]) ?? []).join(", ") || "NM, LP, MP…"}
                  </p>
                  <p className="text-xs text-luxury-mist">
                    Idiomas: {((cfg.languages as string[]) ?? []).join(", ") || "pt, en, jp"}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </PageShell>
    </>
  );
}
