"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseDeckList, resolveCards, type ParsedCard } from "@/lib/deck-parser";
import type { DeckFormatRules } from "@/lib/deck-validation";
import type { DeckBuilderZoneId } from "@/types/deck";
import { ImportPreview } from "./ImportPreview";

interface ImportDeckModalProps {
  open: boolean;
  onClose: () => void;
  gameCode: string;
  formatRules: DeckFormatRules;
  onImport: (items: ParsedCard[]) => Promise<void>;
  busy?: boolean;
}

export function ImportDeckModal({
  open,
  onClose,
  gameCode,
  formatRules,
  onImport,
  busy,
}: ImportDeckModalProps) {
  const [input, setInput] = useState("");
  const [preview, setPreview] = useState<ParsedCard[]>([]);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!open) {
      setInput("");
      setPreview([]);
    }
  }, [open]);

  const handlePreview = async () => {
    const parsed = parseDeckList(input);
    setResolving(true);
    try {
      const resolved = await resolveCards(parsed, gameCode, formatRules);
      setPreview(resolved);
    } finally {
      setResolving(false);
    }
  };

  const importable = preview.filter((p) => p.found && !p.error);

  const handleImport = async () => {
    if (importable.length === 0) return;
    await onImport(importable);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-foreground/60 p-4 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-border bg-background">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-lg font-semibold text-foreground">Importar deck</h2>
          <button type="button" className="rounded-md p-2 hover:bg-muted" onClick={onClose} aria-label="Fechar">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <label className="block text-sm text-muted-foreground">
            Cole sua lista (ex: 4 Lightning Bolt ou SB: 3 Pyroblast)
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={8}
              className="mt-2 w-full rounded-md border border-border bg-card p-3 font-mono text-sm text-foreground"
              placeholder={"4 Lightning Bolt\n2 Counterspell\nSB: 3 Pyroblast"}
            />
          </label>

          <Button type="button" variant="outline" size="sm" onClick={() => void handlePreview()} disabled={resolving || !input.trim()}>
            {resolving ? "Resolvendo..." : "Atualizar preview"}
          </Button>

          <div>
            <h3 className="mb-2 text-sm font-medium text-foreground">Preview</h3>
            <ImportPreview items={preview} />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border p-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => void handleImport()}
            disabled={busy || importable.length === 0}
          >
            Importar ({importable.length})
          </Button>
        </div>
      </div>
    </div>
  );
}

export function zoneForParsedCard(item: ParsedCard): DeckBuilderZoneId {
  if (item.isSideboard) return "sideboard";
  return "main";
}
