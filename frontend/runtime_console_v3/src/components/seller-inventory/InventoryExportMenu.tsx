"use client";

import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/async-state";
import type { InventoryKind, InventorySource } from "./types";

type Props = {
  source: InventorySource;
  kind: InventoryKind;
  game: string;
  query: string;
  selectedIds: string[];
};

export function InventoryExportMenu({ source, kind, game, query, selectedIds }: Props) {
  const [error, setError] = useState<string | null>(null);

  const exportMut = useMutation({
    mutationFn: async (format: "csv" | "json") => {
      const res = await fetch("/api/seller/inventory/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format,
          source,
          kind,
          game,
          q: query || undefined,
          ids: selectedIds.length ? selectedIds : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(String((data as { detail?: string }).detail ?? "Falha no export"));
      return data as { filename: string; content: string; format: string };
    },
    onSuccess: (data) => {
      setError(null);
      const blob = new Blob([data.content], {
        type: data.format === "json" ? "application/json" : "text/csv",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      a.click();
      URL.revokeObjectURL(url);
    },
    onError: (err: Error) => setError(err.message),
  });

  const label = useMemo(
    () => (selectedIds.length ? `Seleção (${selectedIds.length})` : "Filtro atual"),
    [selectedIds.length],
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">Exportar {label}</span>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={exportMut.isPending}
        onClick={() => exportMut.mutate("csv")}
      >
        CSV
      </Button>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={exportMut.isPending}
        onClick={() => exportMut.mutate("json")}
      >
        JSON
      </Button>
      <Button type="button" size="sm" variant="ghost" disabled title="XLSX na próxima iteração">
        XLSX
      </Button>
      {error ? <InlineAlert message={error} tone="error" /> : null}
    </div>
  );
}
