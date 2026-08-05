import Link from "next/link";
import { MobileLayout } from "@/components/layout/MobileLayout";
import {
  NAV_GAME_IDS,
  PRODUCT_CATEGORY_META,
  marketplaceCategoryHref,
  singlesSearchHref,
  type ProductCategoryId,
} from "@/lib/tcg-product-categories";
import { GAME_TOKENS } from "@/lib/tcg-tokens";
import type { GameId } from "@/types/card";

export type CategoryHubKind = "singles" | "selados" | "acessorios";

const HUB_COPY: Record<
  CategoryHubKind,
  { title: string; description: string; emptyHint: string }
> = {
  singles: {
    title: "Singles",
    description: "Cartas avulsas por jogo. Compare ofertas quando existirem — sem estoque inventado.",
    emptyHint: "Sem ofertas agora? Entre na lista de interesse ou explore a coleção do jogo.",
  },
  selados: {
    title: "Selados",
    description: "Boosters, displays, decks e kits. Categorias vazias permanecem visíveis.",
    emptyHint: "Sem ofertas neste momento. Você pode acompanhar pré-vendas e coleções.",
  },
  acessorios: {
    title: "Acessórios",
    description: "Sleeves, deck boxes, playmats, Perfect Fit e mais.",
    emptyHint: "Sem ofertas agora. Use a lista de interesse ou veja marcas populares abaixo.",
  },
};

const SEALED_IDS: ProductCategoryId[] = [
  "booster",
  "booster_box",
  "starter_deck",
  "preconstructed_deck",
  "bundle",
  "box_set_display",
  "tin",
  "blisters",
  "prerelease_pack",
];

const ACCESSORY_IDS: ProductCategoryId[] = [
  "sleeve",
  "deck_box",
  "playmat",
  "album",
  "dice",
  "accessory",
  "empty_storage",
];

type Props = {
  kind: CategoryHubKind;
};

function gameHref(kind: CategoryHubKind, gameId: GameId): string {
  const slug = GAME_TOKENS[gameId]?.slug ?? gameId.toLowerCase();
  if (kind === "singles") return singlesSearchHref(slug);
  if (kind === "selados") return marketplaceCategoryHref(slug, "booster");
  return marketplaceCategoryHref(slug, "sleeve");
}

export function CategoryHubPage({ kind }: Props) {
  const copy = HUB_COPY[kind];
  const categoryIds =
    kind === "singles" ? (["single"] as ProductCategoryId[]) : kind === "selados" ? SEALED_IDS : ACCESSORY_IDS;

  return (
    <MobileLayout>
      <div className="container mx-auto px-4 py-8">
        <Link href="/loja" className="text-sm text-muted-foreground hover:text-foreground">
          ← Comprar
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight" data-testid={`hub-${kind}-title`}>
          {copy.title}
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{copy.description}</p>

        <section className="mt-10" aria-labelledby="hub-games">
          <h2 id="hub-games" className="text-lg font-semibold">
            {kind === "singles" ? "Jogos" : "Por jogo"}
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {NAV_GAME_IDS.map((gameId) => {
              const token = GAME_TOKENS[gameId];
              if (!token) return null;
              return (
                <li key={gameId}>
                  <Link
                    href={gameHref(kind, gameId)}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-primary/40"
                    data-testid={`hub-${kind}-game-${token.slug}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={token.logo} alt="" className="h-10 w-10 object-contain" />
                    <div className="min-w-0">
                      <p className="font-semibold">{token.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Ver {copy.title.toLowerCase()} · ofertas reais quando existirem
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {kind !== "singles" && (
          <section className="mt-12" aria-labelledby="hub-types">
            <h2 id="hub-types" className="text-lg font-semibold">
              Categorias
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {categoryIds.map((id) => {
                const meta = PRODUCT_CATEGORY_META[id];
                return (
                  <li key={id}>
                    <Link
                      href={`/marketplace/produtos?category=${id}`}
                      className="flex flex-col rounded-xl border border-border bg-card p-4 transition hover:border-primary/40"
                      data-testid={`hub-cat-${id}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={meta.imageUrl}
                        alt=""
                        className="mb-3 h-12 w-12 object-contain opacity-90"
                      />
                      <p className="font-medium">{meta.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Preço inicial e ofertas quando houver listagens
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <aside
          className="mt-12 rounded-xl border border-dashed border-border bg-muted/20 p-6"
          data-testid={`hub-${kind}-empty-hint`}
        >
          <p className="font-medium text-foreground">Sem estoque inventado</p>
          <p className="mt-1 text-sm text-muted-foreground">{copy.emptyHint}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/wishlist"
              className="inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm hover:bg-muted"
            >
              Lista de interesse
            </Link>
            <Link
              href="/loja/busca"
              className="inline-flex min-h-10 items-center rounded-md bg-primary px-3 text-sm text-primary-foreground"
            >
              Buscar produtos
            </Link>
          </div>
        </aside>
      </div>
    </MobileLayout>
  );
}
