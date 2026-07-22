"use client";

import Link from "next/link";
import { gameMetaFromCode, type CollectionEnrichedItem } from "@/lib/collection-v2";
import { gameCardDetailPath } from "@/lib/game-routes";

type Props = {
  acquisitions: CollectionEnrichedItem[];
  salesEmptyHref?: string;
};

export function CollectionTimeline({ acquisitions, salesEmptyHref = "/vendedor/painel" }: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-2" data-testid="collection-timeline">
      <section aria-labelledby="acq-title">
        <h2 id="acq-title" className="text-h3 text-foreground">
          Últimas aquisições
        </h2>
        {acquisitions.length === 0 ? (
          <p className="mt-3 text-small text-muted-foreground">
            Sem aquisições recentes. Adicione cartas ou importe CSV.
          </p>
        ) : (
          <ol className="mt-3 space-y-3">
            {acquisitions.map((item) => {
              const meta = gameMetaFromCode(item.card?.game_code);
              return (
                <li
                  key={item.id}
                  className="rounded-lg border border-border/60 bg-card/30 px-3 py-2"
                >
                  <Link
                    href={gameCardDetailPath(meta.slug, item.card_id)}
                    className="font-medium text-foreground hover:text-primary"
                  >
                    {item.card?.name ?? "Carta"}
                  </Link>
                  <p className="text-caption text-muted-foreground">
                    Coleção · qty {item.quantity}
                    {item.condition ? ` · ${item.condition}` : ""}
                    {item.acquired_at
                      ? ` · ${new Date(item.acquired_at).toLocaleDateString("pt-BR")}`
                      : ""}
                  </p>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section aria-labelledby="sales-title">
        <h2 id="sales-title" className="text-h3 text-foreground">
          Últimas vendas
        </h2>
        <p className="mt-3 text-small text-muted-foreground">
          Timeline de vendas do jogador ainda depende do histórico público de pedidos. Enquanto
          isso, gerencie anúncios no painel.
        </p>
        <Link
          href={salesEmptyHref}
          className="mt-3 inline-block text-small text-primary hover:underline"
        >
          Abrir painel de vendas
        </Link>
      </section>
    </div>
  );
}
