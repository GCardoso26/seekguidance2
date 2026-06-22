"use client";

import { ShoppingCart } from "lucide-react";
import { useShopCart } from "@/hooks/useShopCart";
import { useCartStore } from "@/stores/cartStore";

export function CartHeaderButton() {
  const openCart = useCartStore((s) => s.openCart);
  const { data: cart } = useShopCart();
  const count = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <button
      type="button"
      onClick={openCart}
      className="relative rounded-lg p-2 text-luxury-mist hover:bg-white/5 hover:text-luxury-gold"
      aria-label={`Carrinho${count ? `, ${count} itens` : ""}`}
    >
      <ShoppingCart className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-luxury-gold px-1 text-[10px] font-bold text-luxury-onyx">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
