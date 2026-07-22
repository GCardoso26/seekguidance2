"use client";

import { useState } from "react";
import { Copy, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Deck } from "@/types/deck";
import { copyToClipboard, downloadTextFile, exportDeckFull } from "@/lib/deck-exporter";
import { exportDeck } from "@/hooks/useDeck";

interface ExportDeckButtonProps {
  deck: Deck;
}

type LocalFormat = "text" | "mtgo" | "json" | "csv" | "judgetcg";

export function ExportDeckButton({ deck }: ExportDeckButtonProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const runLocal = async (format: LocalFormat, action: "copy" | "download") => {
    setBusy(true);
    try {
      const content = exportDeckFull(deck, format);
      const base = deck.name.replace(/\s+/g, "-").toLowerCase();
      const ext = format === "json" || format === "judgetcg" ? "json" : format === "csv" ? "csv" : "txt";
      if (action === "copy") {
        await copyToClipboard(content);
        setMessage("Copiado!");
      } else {
        downloadTextFile(content, `${base}.${ext}`);
        setMessage("Download iniciado");
      }
      setTimeout(() => setMessage(null), 2500);
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const runApi = async (format: "text" | "dec" | "arena") => {
    setBusy(true);
    try {
      const result = await exportDeck(deck.id, format);
      await copyToClipboard(result.content);
      setMessage(`Export ${format} copiado`);
      setTimeout(() => setMessage(null), 2500);
      setOpen(false);
    } catch {
      setMessage("Falha no export API");
      setTimeout(() => setMessage(null), 2500);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative">
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen((v) => !v)} disabled={busy}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Copy className="mr-2 h-4 w-4" />}
        Exportar
      </Button>

      {open && (
        <div className="absolute right-0 z-20 mt-1 max-h-72 min-w-[220px] overflow-y-auto rounded-lg border border-border bg-background p-1 shadow-xl">
          {(
            [
              ["text", "TXT"],
              ["mtgo", "MTGO"],
              ["json", "JSON"],
              ["csv", "CSV"],
              ["judgetcg", "JudgeTCG"],
            ] as const
          ).map(([fmt, label]) => (
            <button
              key={fmt}
              type="button"
              className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-muted"
              onClick={() => void runLocal(fmt, "copy")}
            >
              <Copy className="h-4 w-4" /> Copiar {label}
            </button>
          ))}
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-muted"
            onClick={() => void runApi("arena")}
          >
            <Copy className="h-4 w-4" /> Copiar Arena (API)
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-muted"
            onClick={() => void runLocal("mtgo", "download")}
          >
            <Download className="h-4 w-4" /> Download .txt
          </button>
        </div>
      )}

      {message && <span className="ml-2 text-xs text-success">{message}</span>}
    </div>
  );
}
