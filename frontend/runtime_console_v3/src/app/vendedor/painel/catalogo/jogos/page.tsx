"use client";

import { PageHeader, PageShell } from "@/components/seller-dashboard/PageShell";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { useCatalogGames } from "@/hooks/useCatalogCards";
import { isGameInImplementationWave } from "@/lib/game-rollout";
import { getTcgBrand } from "@/lib/tcg-brand";
import { cn } from "@/lib/utils";
import type { TcgType } from "@/types/judge";

export default function CatalogoJogosPage() {
  const { data, isLoading } = useCatalogGames();

  return (
    <>
      <SellerHeader action={null} />
      <PageShell>
        <PageHeader
          title="Jogos"
          description="TCGs da wave atual — demais títulos ficam desabilitados até nova implementação."
        />
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(data?.games ?? []).map((game) => {
              const slug = String(game.slug ?? "magic");
              const code = String(game.game_code ?? "");
              const enabled =
                isGameInImplementationWave(code) || isGameInImplementationWave(slug);
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
                  className={cn(
                    "surface-card p-4",
                    !enabled && "opacity-45 grayscale pointer-events-none",
                  )}
                  aria-disabled={!enabled}
                  title={enabled ? undefined : "Em breve — fora da wave atual"}
                  style={
                    brand
                      ? { borderColor: `${brand.accent}40` }
                      : undefined
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-lg font-semibold">{String(game.display_name ?? game.name)}</p>
                    {!enabled ? (
                      <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                        Em breve
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">{code}</p>
                  {enabled ? (
                    <>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Condições: {((cfg.conditions as string[]) ?? []).join(", ") || "NM, LP, MP…"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Idiomas: {((cfg.languages as string[]) ?? []).join(", ") || "pt, en, jp"}
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Ainda não disponível para configuração nesta wave.
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </PageShell>
    </>
  );
}
