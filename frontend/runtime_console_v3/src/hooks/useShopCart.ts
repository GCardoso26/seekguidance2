"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { addProductToCart, type ShopCart } from "@/lib/marketplace-shop";
import { trackEvent } from "@/lib/analytics";
import { useCartStore } from "@/stores/cartStore";
import { useJudgeToast } from "@/hooks/use-judge-toast";
import type { CardListing, UnifiedCard } from "@/types/card";
import { getListingProductId } from "@/lib/listing-utils";

export const SHOP_CART_QUERY_KEY = ["shop-cart"] as const;

async function fetchShopCart(): Promise<ShopCart | null> {
  const res = await fetch("/api/marketplace/shop/cart");
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("cart_fetch_failed");
  const data = (await res.json()) as { cart?: ShopCart };
  return data.cart ?? null;
}

export function useShopCart() {
  return useQuery({
    queryKey: SHOP_CART_QUERY_KEY,
    queryFn: fetchShopCart,
    staleTime: 30_000,
  });
}

export function useAddListingToCart() {
  const queryClient = useQueryClient();
  const openCart = useCartStore((s) => s.openCart);
  const router = useRouter();
  const { cart: cartToast, error: errorToast } = useJudgeToast();

  return useMutation({
    mutationFn: async ({
      listing,
      quantity = 1,
    }: {
      listing: CardListing;
      card?: UnifiedCard;
      quantity?: number;
    }) => {
      const productId = getListingProductId(listing);
      if (!productId) {
        throw new Error("Esta oferta não está disponível para compra online.");
      }
      return addProductToCart(productId, quantity, listing.cardId);
    },
    onSuccess: (result, variables) => {
      if (result.ok) {
        void trackEvent("add_to_cart", {
          product_id: getListingProductId(variables.listing),
          card_id: variables.listing.cardId,
          card_name: variables.card?.name,
          price: variables.listing.price,
          seller_id: variables.listing.sellerId,
        });
        void queryClient.invalidateQueries({ queryKey: SHOP_CART_QUERY_KEY });
        cartToast(variables.card?.name ?? "Item");
        openCart();
        return;
      }
      if (result.needsLogin) {
        const returnPath =
          typeof window !== "undefined"
            ? window.location.pathname
            : `/loja/cartas/${variables.listing.cardId}`;
        router.push(`/entrar?next=${encodeURIComponent(returnPath)}`);
        return;
      }
      throw new Error(result.message);
    },
    onError: (err) => {
      errorToast(err instanceof Error ? err.message : "Erro ao adicionar ao carrinho");
    },
  });
}
