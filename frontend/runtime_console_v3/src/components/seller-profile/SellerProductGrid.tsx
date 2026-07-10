"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSellerProducts } from "@/hooks/useSellerProfile";
import type { SellerProduct, SellerProductFilters } from "@/lib/seller-profile-query";
import { formatCurrency } from "@/lib/format-currency";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  username: string;
  filters: SellerProductFilters;
};

function SellerProductCard({ product }: { product: SellerProduct }) {
  const name = product.name_pt ?? product.name_en;
  return (
    <Link
      href={`/marketplace/product/${product.id}`}
      className="flex flex-col overflow-hidden rounded-xl border border-border bg-card/50 transition hover:border-primary/30"
    >
      <div className="flex h-36 items-center justify-center bg-muted/50 p-3">
        {product.image_url ? (
          <Image src={product.image_url} alt="" width={100} height={140} className="max-h-32 object-contain" />
        ) : (
          <span className="text-xs text-muted-foreground">Sem imagem</span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="line-clamp-2 text-sm font-medium text-foreground">{name}</p>
        {product.expansion && (
          <p className="mt-1 text-xs text-muted-foreground">
            {product.expansion.code.toUpperCase()} · {product.expansion.name_en}
          </p>
        )}
        <p className="mt-2 text-lg font-bold text-primary">
          {formatCurrency(product.price.cents / 100, product.price.currency)}
        </p>
        <p className="text-xs text-muted-foreground">
          {product.condition} · Qtd {product.quantity}
          {product.foil && " · Foil"}
          {product.graded && " · Graduada"}
        </p>
      </div>
    </Link>
  );
}

export function SellerProductGrid({ username, filters }: Props) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useSellerProducts(
    username,
    filters,
  );

  const products = useMemo(() => data?.pages.flatMap((p) => p.products) ?? [], [data]);
  const total = data?.pages[0]?.total ?? 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-xl" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return <p className="text-muted-foreground">Nenhum produto encontrado com estes filtros.</p>;
  }

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">{total} produto(s)</p>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {products.map((p) => (
          <SellerProductCard key={p.id} product={p} />
        ))}
      </div>
      {hasNextPage && (
        <Button
          variant="outline"
          className="mt-6 w-full border-border"
          disabled={isFetchingNextPage}
          onClick={() => fetchNextPage()}
        >
          {isFetchingNextPage ? "Carregando…" : "Carregar mais"}
        </Button>
      )}
    </div>
  );
}
