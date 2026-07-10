"use client";

import Image from "next/image";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SHOP_CART_QUERY_KEY, useShopCart } from "@/hooks/useShopCart";
import { formatShopPrice } from "@/lib/marketplace-shop";
import { useCartStore } from "@/stores/cartStore";
import { useQueryClient } from "@tanstack/react-query";

export function CartDrawer() {
  const { isOpen, closeCart } = useCartStore();
  const { data: cart, isLoading } = useShopCart();
  const queryClient = useQueryClient();
  const items = cart?.items ?? [];
  const totalCents = cart?.total_cents ?? 0;
  const storeIds = new Set(items.map((i) => i.store_id));
  const uniqueSellers = storeIds.size;

  async function updateQty(productId: string, quantity: number) {
    await fetch(`/api/marketplace/shop/cart/items/${encodeURIComponent(productId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
    await queryClient.invalidateQueries({ queryKey: SHOP_CART_QUERY_KEY });
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open: boolean) => !open && closeCart()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-border bg-background shadow-xl outline-none">
          <div className="flex items-center justify-between border-b px-4 py-4">
            <Dialog.Title className="flex items-center gap-2 text-lg font-semibold">
              <ShoppingCart className="h-5 w-5" />
              Carrinho ({items.reduce((s, i) => s + i.quantity, 0)})
            </Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" className="rounded p-1 hover:bg-muted" aria-label="Fechar carrinho">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          {isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Carregando carrinho…</p>
          ) : items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
              <ShoppingCart className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Seu carrinho está vazio</p>
              <Button variant="outline" className="mt-4" onClick={closeCart}>
                Continuar comprando
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.product_id} className="flex gap-3">
                      <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                        {item.image ? (
                          <Image src={item.image} alt="" fill className="object-cover" sizes="56px" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-caption text-muted-foreground">
                            TCG
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{item.name}</p>
                        <p className="text-sm font-semibold">{formatShopPrice(item.price_cents * item.quantity)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => updateQty(item.product_id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-sm">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => updateQty(item.product_id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-danger"
                          onClick={() => updateQty(item.product_id, 0)}
                          aria-label="Remover item"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 border-t p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatShopPrice(totalCents)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Envio</span>
                    <span>Calculado no checkout</span>
                  </div>
                  {uniqueSellers > 1 && (
                    <p className="text-xs text-warning">
                      {uniqueSellers} vendedores — envios separados
                    </p>
                  )}
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatShopPrice(totalCents)}</span>
                </div>
                <Button className="w-full" size="lg" asChild onClick={closeCart}>
                  <Link href="/checkout">Finalizar compra</Link>
                </Button>
                <Button variant="outline" className="w-full" onClick={closeCart}>
                  Continuar comprando
                </Button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
