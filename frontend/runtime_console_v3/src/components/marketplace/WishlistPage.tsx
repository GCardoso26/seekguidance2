"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { useRemoveFromWishlist, useWishlist } from "@/hooks/useWishlist";
import {
  useCreateWishlistList,
  useDuplicateWishlistList,
  useShareWishlistList,
  useWishlistListDetail,
  useWishlistLists,
} from "@/hooks/useWishlistLists";
import { addProductToCart } from "@/lib/marketplace-shop";
import { showToast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import {
  addProductToList,
  createWishlistList,
  getListProductIds,
  loadWishlistLists,
} from "@/lib/wishlist-lists";
import { trackEvent } from "@/lib/analytics";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { Input } from "@/components/ui/input";
import type { ShopProduct } from "@/lib/marketplace-shop";

export function WishlistPage() {
  const wishlistV2 = isFeatureEnabled("WISHLIST_V2");
  const { data, isLoading } = useWishlist();
  const { data: listsData, isLoading: listsLoading } = useWishlistLists();
  const remove = useRemoveFromWishlist();
  const createList = useCreateWishlistList();
  const shareList = useShareWishlistList();
  const duplicateList = useDuplicateWishlistList();
  const queryClient = useQueryClient();
  const flatItems = data?.items ?? [];
  const [localLists, setLocalLists] = useState(() => loadWishlistLists());
  const backendLists = listsData?.lists ?? [];
  const [activeList, setActiveList] = useState<string>("default");
  const [newListName, setNewListName] = useState("");

  useEffect(() => {
    if (wishlistV2 && backendLists.length > 0 && activeList === "default") {
      const def = backendLists.find((l) => l.is_default) ?? backendLists[0];
      setActiveList(def.id);
    }
  }, [wishlistV2, backendLists, activeList]);

  const { data: listDetail } = useWishlistListDetail(wishlistV2 ? activeList : null);

  const lists = wishlistV2
    ? backendLists.map((l) => ({ id: l.id, name: l.name }))
    : localLists;

  const items = useMemo(() => {
    if (!wishlistV2) {
      if (activeList === "default") return flatItems;
      const ids = new Set(getListProductIds(activeList));
      return flatItems.filter((i) => ids.has(i.product_id));
    }
    const detailItems = listDetail?.items ?? [];
    return detailItems.map((i) => ({
      product_id: i.product_id,
      product: i.product as ShopProduct,
      added_at: i.added_at,
    }));
  }, [wishlistV2, flatItems, activeList, listDetail]);

  const loading = isLoading || (wishlistV2 && listsLoading);

  async function handleAddToCart(productId: string) {
    const result = await addProductToCart(productId);
    if (result.ok) {
      await queryClient.invalidateQueries({ queryKey: ["shop-cart"] });
      void trackEvent("wishlist_converted", { product_id: productId, action: "add_to_cart" });
      void trackEvent("add_to_cart", { product_id: productId, source: "wishlist" });
      showToast("Produto adicionado ao carrinho", "success");
      return;
    }
    if (result.needsLogin) {
      window.location.href = `/entrar?next=${encodeURIComponent("/wishlist")}`;
      return;
    }
    showToast(result.message, "error");
  }

  async function exportList() {
    const blob = new Blob([JSON.stringify({ list_id: activeList, items }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wishlist-${activeList}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return <p className="text-sm text-luxury-mist">Carregando wishlist…</p>;
  }

  const totalCount = wishlistV2 ? backendLists.reduce((s, l) => s + l.item_count, 0) : flatItems.length;

  if (totalCount === 0 && items.length === 0) {
    return (
      <div
        className="rounded-xl border border-dashed border-white/20 p-10 text-center"
        data-testid="wishlist-empty"
      >
        <p className="text-lg font-semibold text-luxury-frost">Sua wishlist está vazia</p>
        <p className="mt-2 text-sm text-luxury-mist">
          Salve produtos no marketplace para acompanhar depois. Configure alertas de preço, estoque e lojas
          confiáveis.
        </p>
        <Link
          href="/loja"
          className="mt-6 inline-block rounded-lg bg-luxury-gold px-6 py-3 text-sm font-semibold text-luxury-onyx"
        >
          Explorar marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="wishlist-page-content">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-luxury-mist">
          {totalCount} produto{totalCount === 1 ? "" : "s"} salvos · listas inteligentes
          {wishlistV2 ? " (backend)" : ""}
        </p>
        <div className="flex flex-wrap gap-2">
          {wishlistV2 && (
            <>
              <Button type="button" size="sm" variant="outline" onClick={() => void shareList.mutateAsync(activeList)}>
                Compartilhar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void duplicateList.mutateAsync(activeList)}
              >
                Duplicar
              </Button>
            </>
          )}
          <Button type="button" size="sm" variant="outline" onClick={() => void exportList()}>
            Exportar JSON
          </Button>
          <Link
            href="/wishlist/alerts"
            className="text-sm text-luxury-gold hover:underline self-center"
            data-testid="wishlist-alerts-link"
          >
            Alertas de preço / estoque →
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Listas de desejos">
        {lists.map((list) => (
          <button
            key={list.id}
            type="button"
            role="tab"
            aria-selected={activeList === list.id}
            onClick={() => setActiveList(list.id)}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              activeList === list.id
                ? "border-luxury-gold bg-luxury-gold/20 text-luxury-gold"
                : "border-white/15 text-luxury-mist"
            }`}
          >
            {list.name}
          </button>
        ))}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!newListName.trim()) return;
            if (wishlistV2) {
              void createList.mutateAsync(newListName.trim()).then((created) => {
                if (created?.id) setActiveList(String(created.id));
              });
            } else {
              const created = createWishlistList(newListName);
              setLocalLists(loadWishlistLists());
              setActiveList(created.id);
            }
            setNewListName("");
          }}
        >
          <Input
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="Nova lista"
            className="h-8 w-36 border-white/10 bg-luxury-obsidian text-xs"
            aria-label="Nome da nova lista"
          />
          <Button type="submit" size="sm" variant="outline">
            Criar
          </Button>
        </form>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <div key={item.product_id} className="flex flex-col gap-2" data-testid={`wishlist-item-${item.product_id}`}>
            <ProductCard product={item.product} />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                className="flex-1 bg-luxury-gold text-luxury-onyx hover:bg-luxury-gold/90"
                onClick={() => void handleAddToCart(item.product_id)}
                data-testid={`wishlist-add-cart-${item.product_id}`}
              >
                Adicionar ao carrinho
              </Button>
              {!wishlistV2 && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-white/20"
                  onClick={() => {
                    addProductToList(activeList, item.product_id);
                    showToast(`Salvo em “${lists.find((l) => l.id === activeList)?.name ?? "lista"}”`, "success");
                  }}
                >
                  + Lista
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-white/20"
                disabled={remove.isPending}
                onClick={() => {
                  void trackEvent("wishlist_remove", { product_id: item.product_id });
                  void remove.mutateAsync(item.product_id);
                }}
                data-testid={`wishlist-remove-${item.product_id}`}
              >
                Remover
              </Button>
            </div>
          </div>
        ))}
      </div>
      {items.length === 0 && (
        <p className="text-sm text-luxury-mist">Nenhum item nesta lista. Use “+ Lista” nos favoritos.</p>
      )}
    </div>
  );
}
