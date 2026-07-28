"use client";

import Link from "next/link";
import { useGamePortal } from "@/components/experience/GameProvider";
import { LargeSealedCard } from "@/components/experience/cards/LargeVisualCards";
import { usePortalCategoryImages } from "@/hooks/usePortalCategoryImages";
import {
  GAME_FEATURED_CATEGORY,
  getCategoriesForGame,
  marketplaceCategoryHref,
  type ProductCategoryId,
} from "@/lib/tcg-product-categories";

function SectionHeader({
  title,
  href,
  linkLabel = "Ver todos",
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-5 flex items-baseline justify-between gap-3">
      <h2 className="portal-section-title text-xl md:text-2xl">{title}</h2>
      {href ? (
        <Link href={href} className="portal-link text-xs font-medium hover:underline">
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}

type Props = {
  marketplaceHref: string;
};

/** Selados com imagem do catálogo mestre quando disponível; fallback SVG. */
export function PortalSealedProductsSection({ marketplaceHref }: Props) {
  const { gameId, slug, theme } = useGamePortal();
  const categories = getCategoriesForGame(gameId);
  const featuredCat = GAME_FEATURED_CATEGORY[gameId] ?? "booster_box";
  const featuredMeta = categories.find((c) => c.id === featuredCat) ?? categories[0];
  const sealedCats = categories.filter((c) => c.id !== "single").slice(0, 4);
  const displayCats = (sealedCats.length ? sealedCats : featuredMeta ? [featuredMeta] : []).filter(
    Boolean,
  );
  const categoryIds = displayCats.map((c) => c.id);

  const { images } = usePortalCategoryImages(gameId, categoryIds);

  function categoryHref(catId: ProductCategoryId): string {
    return marketplaceCategoryHref(slug, catId);
  }

  return (
    <section className="portal-section container mx-auto max-w-6xl px-4 py-12">
      <SectionHeader title="Produtos selados" href={marketplaceHref} linkLabel="Loja" />
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {displayCats.map((cat) => (
          <li key={cat.id}>
            <LargeSealedCard
              href={categoryHref(cat.id)}
              title={cat.label}
              imageUrl={images[cat.id] ?? cat.imageUrl}
              subtitle={`Selados · ${theme.name}`}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
