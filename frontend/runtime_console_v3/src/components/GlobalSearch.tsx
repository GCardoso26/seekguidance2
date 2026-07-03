"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import type { GlobalSearchItem } from "@/lib/seller-global-search-mock";
import { isFeatureEnabled } from "@/lib/feature-flags";

const CATEGORY_LABELS: Record<string, string> = {
  orders: "Pedidos",
  customers: "Clientes",
  listings: "Cartas",
  products: "Produtos",
  coupons: "Cupons",
};

const CATEGORY_ORDER = ["orders", "customers", "listings", "products", "coupons"] as const;

function statusLabel(status?: string) {
  const map: Record<string, string> = {
    pending: "Pendente",
    paid: "Pago",
    processing: "Processando",
    shipped: "Enviado",
    delivered: "Entregue",
    cancelled: "Cancelado",
  };
  return status ? map[status] ?? status : "";
}

function navigateToResult(item: GlobalSearchItem, router: ReturnType<typeof useRouter>) {
  switch (item.type) {
    case "order":
      router.push(`/vendedor/painel/pedidos?drawer=${encodeURIComponent(item.id)}`);
      break;
    case "customer":
      router.push(`/vendedor/painel/clientes/lista?customer=${encodeURIComponent(item.id)}`);
      break;
    case "listing":
      router.push(
        `/vendedor/painel/catalogo/cartas?search=${encodeURIComponent(item.title)}`,
      );
      break;
    case "product":
      router.push(
        `/vendedor/painel/catalogo/produtos?search=${encodeURIComponent(item.title)}`,
      );
      break;
    case "coupon":
      router.push(
        `/vendedor/painel/marketing/cupons?search=${encodeURIComponent(item.title)}`,
      );
      break;
  }
}

type GlobalSearchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function GlobalSearchDialog({ open, onOpenChange }: GlobalSearchDialogProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const { data, isLoading } = useGlobalSearch(query);

  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(t);
    }
    setQuery("");
  }, [open]);

  const selectItem = useCallback(
    (item: GlobalSearchItem) => {
      navigateToResult(item, router);
      onOpenChange(false);
    },
    [router, onOpenChange],
  );

  if (!isFeatureEnabled("GLOBAL_SEARCH")) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/70" />
        <Dialog.Content
          className="fixed left-1/2 top-[12%] z-[61] w-[min(560px,calc(100vw-2rem))] -translate-x-1/2 rounded-xl border border-white/10 bg-luxury-onyx shadow-2xl outline-none"
          aria-label="Busca global"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
            <Search className="h-4 w-4 text-luxury-mist" aria-hidden />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar..."
              className="flex-1 bg-transparent text-sm outline-none"
              aria-label="Pesquisar pedidos, clientes, cartas..."
              data-testid="seller-global-search-input"
            />
            <Dialog.Close
              aria-label="Fechar busca"
              className="rounded p-1 hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-2" role="listbox">
            {query.length < 2 && (
              <p className="px-2 py-4 text-sm text-luxury-mist">Digite ao menos 2 caracteres.</p>
            )}
            {query.length >= 2 && isLoading && (
              <p className="px-2 py-4 text-sm text-luxury-mist">Buscando…</p>
            )}
            {query.length >= 2 && !isLoading && data?.total === 0 && (
              <p className="px-2 py-4 text-sm text-luxury-mist">Nenhum resultado para &quot;{query}&quot;.</p>
            )}
            {data &&
              CATEGORY_ORDER.map((catKey) => {
                const items = data.categories[catKey];
                if (!items?.length) return null;
                return (
                  <div key={catKey} className="mb-2">
                    <p className="px-2 py-1 text-xs font-semibold uppercase text-luxury-mist">
                      {CATEGORY_LABELS[catKey]}
                    </p>
                    {items.map((item) => (
                      <button
                        key={`${item.type}-${item.id}`}
                        type="button"
                        role="option"
                        className="flex w-full flex-col rounded-lg px-3 py-2 text-left text-sm hover:bg-white/5"
                        onClick={() => selectItem(item)}
                      >
                        <span className="font-medium">
                          {item.title}
                          {item.type === "order" && item.status && (
                            <span className="ml-2 text-xs text-luxury-mist">
                              ({statusLabel(item.status)})
                            </span>
                          )}
                        </span>
                        {item.subtitle && (
                          <span className="text-xs text-luxury-mist">{item.subtitle}</span>
                        )}
                      </button>
                    ))}
                    <div className="my-1 border-t border-white/5" />
                  </div>
                );
              })}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

type GlobalSearchTriggerProps = {
  onOpen: () => void;
  className?: string;
};

export function GlobalSearchTrigger({ onOpen, className }: GlobalSearchTriggerProps) {
  if (!isFeatureEnabled("GLOBAL_SEARCH")) return null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={
        className ??
        "flex min-h-[44px] flex-1 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-luxury-mist hover:bg-white/10 lg:max-w-md"
      }
      aria-label="Abrir busca global (Ctrl+K)"
      data-testid="seller-global-search-trigger"
    >
      <Search className="h-4 w-4 shrink-0" aria-hidden />
      <span className="flex-1 text-left">Pesquisar…</span>
      <kbd className="hidden rounded border border-white/20 px-1.5 text-[10px] sm:inline">⌘K</kbd>
    </button>
  );
}

/** Atalho Cmd/Ctrl+K — usar no layout do painel */
export function useGlobalSearchShortcut(onOpen: () => void) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpen();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onOpen]);
}
