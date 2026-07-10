"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { X } from "lucide-react";
import type { SellerListingRow } from "@/types/seller-listing";

type PriceModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onApply: (mode: "percent" | "fixed", value: number) => void;
};

export function BulkPriceModal({ open, onOpenChange, selectedCount, onApply }: PriceModalProps) {
  const [mode, setMode] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState("5");

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/70" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[71] w-[min(360px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-background p-5">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="font-semibold">Ajuste de preço em massa</Dialog.Title>
            <Dialog.Close aria-label="Fechar" className="rounded p-1 hover:bg-muted">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <p className="mb-3 text-sm text-muted-foreground">{selectedCount} anúncio(s) selecionado(s)</p>
          <div className="mb-3 flex gap-2">
            <button
              type="button"
              onClick={() => setMode("percent")}
              className={`rounded-lg px-3 py-1.5 text-xs ${mode === "percent" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            >
              Percentual
            </button>
            <button
              type="button"
              onClick={() => setMode("fixed")}
              className={`rounded-lg px-3 py-1.5 text-xs ${mode === "fixed" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            >
              Valor fixo
            </button>
          </div>
          <input
            type="number"
            step={mode === "percent" ? "1" : "0.01"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="mb-4 w-full surface-card rounded-lg px-3 py-2 text-sm"
            aria-label={mode === "percent" ? "Percentual" : "Valor fixo"}
          />
          <button
            type="button"
            onClick={() => {
              const n = Number(value);
              if (!Number.isFinite(n)) return;
              onApply(mode, n);
              onOpenChange(false);
            }}
            className="w-full rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground"
          >
            Aplicar
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

type InventoryModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onApply: (quantity: number) => void;
};

export function BulkInventoryModal({
  open,
  onOpenChange,
  selectedCount,
  onApply,
}: InventoryModalProps) {
  const [quantity, setQuantity] = useState("1");

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/70" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[71] w-[min(360px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-background p-5">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="font-semibold">Estoque em massa</Dialog.Title>
            <Dialog.Close aria-label="Fechar" className="rounded p-1 hover:bg-muted">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <p className="mb-3 text-sm text-muted-foreground">{selectedCount} anúncio(s)</p>
          <label className="mb-1 block text-xs text-muted-foreground">Nova quantidade</label>
          <input
            type="number"
            min="0"
            step="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="mb-4 w-full surface-card rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => {
              const n = Number(quantity);
              if (!Number.isFinite(n) || n < 0) return;
              onApply(Math.floor(n));
              onOpenChange(false);
            }}
            className="w-full rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground"
          >
            Atualizar estoque
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function BulkConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  onOpenChange,
  onConfirm,
}: ConfirmModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/70" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[71] w-[min(360px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-background p-5">
          <Dialog.Title className="font-semibold">{title}</Dialog.Title>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          <div className="mt-4 flex gap-2">
            <Dialog.Close className="flex-1 rounded-lg border border-white/15 py-2 text-sm">
              Cancelar
            </Dialog.Close>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
              className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground"
            >
              {confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function applyBulkPrice(
  listings: SellerListingRow[],
  ids: string[],
  mode: "percent" | "fixed",
  value: number,
): Record<string, number> {
  const map = new Map(listings.map((l) => [l.id, l]));
  const patches: Record<string, number> = {};
  for (const id of ids) {
    const row = map.get(id);
    if (!row) continue;
    const next =
      mode === "percent"
        ? Math.max(0.01, row.price * (1 + value / 100))
        : Math.max(0.01, value);
    patches[id] = Number(next.toFixed(2));
  }
  return patches;
}
