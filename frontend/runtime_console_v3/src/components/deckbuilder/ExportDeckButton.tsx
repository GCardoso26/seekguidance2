"use client";

import { useState } from "react";
import { Copy, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Deck } from "@/types/deck";
import { copyToClipboard, downloadTextFile, exportDeckFull } from "@/lib/deck-exporter";

interface ExportDeckButtonProps {
  deck: Deck;
}

export function ExportDeckButton({ deck }: ExportDeckButtonProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const runExport = async (format: "text" | "mtgo", action: "copy" | "download") => {
    setBusy(true);
    try {
      const content = exportDeckFull(deck, format);
      if (action === "copy") {
        await copyToClipboard(content);
        setMessage("Lista copiada!");
      } else {
        const ext = format === "mtgo" ? "txt" : "txt";
        downloadTextFile(content, `${deck.name.replace(/\s+/g, "-").toLowerCase()}.${ext}`);
        setMessage("Download iniciado");
      }
      setTimeout(() => setMessage(null), 2500);
      setOpen(false);
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
        <div className="absolute right-0 z-20 mt-1 min-w-[200px] rounded-lg border border-border bg-background p-1 shadow-xl">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-muted"
            onClick={() => void runExport("text", "copy")}
          >
            <Copy className="h-4 w-4" /> Copiar texto
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-muted"
            onClick={() => void runExport("mtgo", "copy")}
          >
            <Copy className="h-4 w-4" /> Copiar MTGO
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-muted"
            onClick={() => void runExport("mtgo", "download")}
          >
            <Download className="h-4 w-4" /> Download .txt
          </button>
        </div>
      )}

      {message && <span className="ml-2 text-xs text-success">{message}</span>}
    </div>
  );
}
