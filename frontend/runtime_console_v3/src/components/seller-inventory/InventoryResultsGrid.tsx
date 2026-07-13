"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InlineAlert } from "@/components/ui/async-state";
import type { InventoryItem, InventoryKind } from "./types";

const CONDITIONS = ["NM", "LP", "MP", "HP", "DM"];
const LANGUAGES = [
  { id: "pt", label: "PT" },
  { id: "en", label: "EN" },
  { id: "jp", label: "JP" },
  { id: "es", label: "ES" },
  { id: "de", label: "DE" },
  { id: "fr", label: "FR" },
  { id: "it", label: "IT" },
];

type Draft = {
  quantity: string;
  add: string;
  price: string;
  condition: string;
  language: string;
};

function toDraft(item: InventoryItem): Draft {
  return {
    quantity: String(item.quantity ?? 0),
    add: "",
    price: ((item.price_cents || 0) / 100).toFixed(2).replace(".", ","),
    condition: item.condition || "NM",
    language: item.language || "pt",
  };
}

function parsePriceCents(raw: string): number | null {
  const n = Number(raw.replace(",", ".").replace(/[^\d.]/g, ""));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

type Props = {
  items: InventoryItem[];
  kind: InventoryKind;
  queryKey: unknown[];
};

export function InventoryResultsGrid({ items, kind, queryKey }: Props) {
  const qc = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [rowError, setRowError] = useState<string | null>(null);

  useEffect(() => {
    const next: Record<string, Draft> = {};
    for (const item of items) next[item.id] = toDraft(item);
    setDrafts(next);
  }, [items]);

  const adjust = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch("/api/seller/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(String((payload as { detail?: string }).detail ?? "Falha ao salvar"));
      }
      return payload;
    },
    onSuccess: () => {
      setRowError(null);
      void qc.invalidateQueries({ queryKey });
      void qc.invalidateQueries({ queryKey: ["seller-inventory"] });
    },
    onError: (err: Error) => setRowError(err.message),
  });

  function updateDraft(id: string, patch: Partial<Draft>) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  function applyRow(item: InventoryItem, mode: "set" | "add") {
    const d = drafts[item.id] ?? toDraft(item);
    const priceCents = parsePriceCents(d.price);
    const qty =
      mode === "add" ? Number.parseInt(d.add || "0", 10) : Number.parseInt(d.quantity || "0", 10);
    if (!Number.isFinite(qty) || qty < 0) {
      setRowError("Quantidade inválida");
      return;
    }
    if (mode === "add" && qty === 0) {
      setRowError("Informe um valor em Somar");
      return;
    }

    const body: Record<string, unknown> = {
      kind,
      mode,
      quantity: qty,
      price_cents: priceCents ?? undefined,
      condition: d.condition,
      language: d.language,
      foil: Boolean(item.foil),
      title: item.title,
      category: item.category || "accessory",
    };
    if (item.listing_id) body.listing_id = item.listing_id;
    if (item.product_id) body.product_id = item.product_id;
    if (item.card_id) body.card_id = item.card_id;

    adjust.mutate(body);
  }

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
        Nenhum item encontrado para estes filtros.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {rowError ? <InlineAlert message={rowError} tone="error" /> : null}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Item</th>
              <th className="px-3 py-2" title="Estoque absoluto">
                Estoque
              </th>
              <th className="px-3 py-2" title="Acrescenta ao estoque atual">
                Somar
              </th>
              <th className="px-3 py-2">Preço (R$)</th>
              {kind === "cards" ? (
                <>
                  <th className="px-3 py-2">Idioma</th>
                  <th className="px-3 py-2">Qualid.</th>
                </>
              ) : null}
              <th className="px-3 py-2">Vendidos</th>
              <th className="px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const d = drafts[item.id] ?? toDraft(item);
              return (
                <tr key={item.id} className="border-b border-border/70 align-middle">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      {item.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image_url}
                          alt=""
                          className="h-12 w-9 rounded object-cover"
                        />
                      ) : (
                        <div className="h-12 w-9 rounded bg-muted" />
                      )}
                      <div>
                        <p className="font-medium text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {[item.set_code, item.category].filter(Boolean).join(" · ") || "—"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      className="h-9 w-16"
                      value={d.quantity}
                      onChange={(e) => updateDraft(item.id, { quantity: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      className="h-9 w-16 bg-primary/5"
                      value={d.add}
                      onChange={(e) => updateDraft(item.id, { add: e.target.value })}
                      placeholder="+"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      className="h-9 w-24"
                      value={d.price}
                      onChange={(e) => updateDraft(item.id, { price: e.target.value })}
                    />
                  </td>
                  {kind === "cards" ? (
                    <>
                      <td className="px-3 py-2">
                        <select
                          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                          value={d.language}
                          onChange={(e) => updateDraft(item.id, { language: e.target.value })}
                        >
                          {LANGUAGES.map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                          value={d.condition}
                          onChange={(e) => updateDraft(item.id, { condition: e.target.value })}
                        >
                          {CONDITIONS.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </td>
                    </>
                  ) : null}
                  <td className="px-3 py-2 text-muted-foreground">
                    {item.sold_qty != null ? item.sold_qty : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={adjust.isPending}
                        onClick={() => applyRow(item, "set")}
                      >
                        Salvar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={adjust.isPending}
                        onClick={() => applyRow(item, "add")}
                      >
                        {item.listing_id || item.product_id ? "Somar" : "Adicionar"}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
