"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PdvBarcodeInput } from "@/components/seller-dashboard/pdv/PdvBarcodeInput";
import { PdvCart } from "@/components/seller-dashboard/pdv/PdvCart";
import { PdvLocalProductModal } from "@/components/seller-dashboard/pdv/PdvLocalProductModal";
import { PdvProductSearch } from "@/components/seller-dashboard/pdv/PdvProductSearch";
import { Button } from "@/components/ui/button";
import { lookupPdvProduct, usePdvSearch } from "@/hooks/usePdvSearch";
import { usePdvSale } from "@/hooks/usePdvSale";
import type { BarcodeInputMode } from "@/lib/pdv-barcode";
import { cartLineKey } from "@/lib/pdv-sale-form";
import {
  pdvCanAddToCart,
  type PdvCartItem,
  type PdvPaymentMethod,
  type PdvProduct,
  type PdvSaleRecord,
} from "@/types/pdv";

const PdvPaymentPanel = dynamic(
  () => import("@/components/seller-dashboard/pdv/PdvPaymentPanel").then((m) => m.PdvPaymentPanel),
  { ssr: false },
);

const PdvReceiptPrint = dynamic(
  () => import("@/components/seller-dashboard/pdv/PdvReceiptPrint").then((m) => m.PdvReceiptPrint),
  { ssr: false },
);

type Props = {
  storeId: string;
  storeName: string;
};

export function PdvManager({ storeId, storeName }: Props) {
  const queryClient = useQueryClient();
  const [cart, setCart] = useState<PdvCartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [localModalOpen, setLocalModalOpen] = useState(false);
  const [lastSale, setLastSale] = useState<PdvSaleRecord | null>(null);
  const [lastPaymentMethod, setLastPaymentMethod] = useState<PdvPaymentMethod>("cash");
  const [receiptItems, setReceiptItems] = useState<PdvCartItem[]>([]);

  const { data: searchResults = [], isFetching } = usePdvSearch({
    storeId,
    q: searchQuery,
    enabled: searchQuery.trim().length >= 2,
  });

  const saleMutation = usePdvSale(storeId);

  const addProduct = useCallback((product: PdvProduct) => {
    const source = product.source ?? "official";
    const line: PdvCartItem = {
      product_id: product.id,
      local_product_id: source === "local" ? (product.local_product_id ?? product.id) : null,
      source,
      name: product.name,
      price_cents: product.price_cents,
      quantity: 1,
      image_url: product.images?.find((u) => Boolean(u?.trim()))?.trim() ?? null,
      category: product.category ?? null,
    };
    const key = cartLineKey(line);
    let added = false;

    setCart((prev) => {
      const existing = prev.find((p) => cartLineKey(p) === key);
      const qtyInCart = existing?.quantity ?? 0;
      if (!pdvCanAddToCart(product.stock, qtyInCart)) {
        toast.error(
          product.stock != null && product.stock <= 0 ? "Produto sem estoque" : "Estoque insuficiente",
        );
        return prev;
      }
      added = true;
      if (existing) {
        return prev.map((p) =>
          cartLineKey(p) === key ? { ...p, quantity: p.quantity + 1 } : p,
        );
      }
      return [...prev, line];
    });
    return added;
  }, []);

  const handleScan = useCallback(
    async (code: string, _mode: BarcodeInputMode) => {
      const product = await lookupPdvProduct(storeId, code);
      if (!product) return false;
      return addProduct(product);
    },
    [storeId, addProduct],
  );

  function adjustQty(lineKey: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) =>
          cartLineKey(item) === lineKey
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  async function completeSale(method: PdvPaymentMethod, notes?: string) {
    if (!cart.length) return;
    try {
      const snapshot = [...cart];
      const sale = await saleMutation.mutateAsync({
        items: snapshot,
        paymentMethod: method,
        notes,
      });
      finishSale(snapshot, sale, method);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao finalizar venda");
    }
  }

  async function completePixSale(partialSale: PdvSaleRecord) {
    if (!cart.length && !partialSale.id) return;
    try {
      const snapshot = [...cart];
      if (partialSale.id) {
        finishSale(snapshot, partialSale, "pix");
        return;
      }
      await completeSale("pix");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao finalizar PIX");
    }
  }

  function finishSale(snapshot: PdvCartItem[], sale: PdvSaleRecord, method: PdvPaymentMethod) {
    setLastSale(sale);
    setLastPaymentMethod(method);
    setReceiptItems(snapshot);
    setCart([]);
    setCheckoutOpen(false);
    setReceiptOpen(true);
    toast.success("Venda registrada com sucesso");
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col gap-4 lg:grid lg:grid-cols-[1fr_22rem] lg:gap-6" data-testid="pdv-manager">
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">Balcão — {storeName}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLocalModalOpen(true)}
              data-testid="pdv-add-local-product"
            >
              Adicionar Produto Local
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/vendedor/painel/pdv/produtos-locais">Produtos Locais</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="lg:hidden">
              <Link href="/vendedor/painel">← Painel</Link>
            </Button>
          </div>
        </div>

        <PdvBarcodeInput onScan={handleScan} disabled={saleMutation.isPending} />

        <PdvProductSearch
          products={searchResults}
          isLoading={isFetching}
          onSearch={setSearchQuery}
          onAdd={(p) => {
            if (addProduct(p)) toast.success(`${p.name} adicionado`);
          }}
        />
      </div>

      <div className="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
        <PdvCart
          items={cart}
          onIncrement={(key) => adjustQty(key, 1)}
          onDecrement={(key) => adjustQty(key, -1)}
          onRemove={(key) => setCart((prev) => prev.filter((i) => cartLineKey(i) !== key))}
          onFinalize={() => setCheckoutOpen(true)}
          isFinalizing={saleMutation.isPending}
          disabled={checkoutOpen}
        />

        {checkoutOpen && cart.length > 0 && (
          <PdvPaymentPanel
            storeId={storeId}
            storeName={storeName}
            items={cart}
            onComplete={completeSale}
            onPixComplete={completePixSale}
            isPending={saleMutation.isPending}
            onCancel={() => setCheckoutOpen(false)}
          />
        )}
      </div>

      <PdvReceiptPrint
        open={receiptOpen}
        sale={lastSale}
        items={receiptItems}
        paymentMethod={lastPaymentMethod}
        storeName={storeName}
        onClose={() => setReceiptOpen(false)}
      />

      <PdvLocalProductModal
        open={localModalOpen}
        storeId={storeId}
        onClose={() => setLocalModalOpen(false)}
        onSaved={() => {
          setLocalModalOpen(false);
          void queryClient.invalidateQueries({ queryKey: ["pdv-search"] });
          void queryClient.invalidateQueries({ queryKey: ["pdv-local-products"] });
          toast.success("Produto local cadastrado");
        }}
      />
    </div>
  );
}
