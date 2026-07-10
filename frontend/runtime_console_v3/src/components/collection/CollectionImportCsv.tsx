"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAddToCollection } from "@/hooks/useDeck";
import { trackEvent } from "@/lib/analytics";
import { showToast } from "@/lib/toast";

/**
 * Importação CSV (client-side parsing) → chama Application Service /api/user/collection.
 * Não move regra de negócio: apenas mapeia linhas e dispara POST existente.
 */
export function CollectionImportCsv() {
  const inputRef = useRef<HTMLInputElement>(null);
  const add = useAddToCollection();
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<string | null>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setReport(null);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) {
        showToast("CSV vazio ou sem cabeçalho", "error");
        return;
      }
      const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
      const idxCard = header.findIndex((h) => ["card_id", "cardid", "id"].includes(h));
      const idxQty = header.findIndex((h) => ["quantity", "qty", "qtd"].includes(h));
      if (idxCard < 0) {
        showToast("Cabeçalho precisa de card_id", "error");
        return;
      }
      let ok = 0;
      let fail = 0;
      for (const line of lines.slice(1)) {
        const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
        const cardId = cols[idxCard];
        if (!cardId) continue;
        const quantity = idxQty >= 0 ? Math.max(1, parseInt(cols[idxQty] || "1", 10) || 1) : 1;
        try {
          await add.mutateAsync({ card_id: cardId, quantity });
          ok += 1;
        } catch {
          fail += 1;
        }
      }
      void trackEvent("collection_import", { ok, fail, source: "csv" });
      setReport(`Importados: ${ok}. Falhas: ${fail}.`);
      showToast(`Importação concluída (${ok} ok)`, fail ? "error" : "success");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4" data-testid="collection-import-csv">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Upload className="h-4 w-4" aria-hidden />
        Importar CSV
      </h2>
      <p className="mt-1 text-xs text-luxury-mist">
        Cabeçalho: <code className="text-luxury-gold">card_id,quantity</code>. Também é possível importar deck pelo Deck Builder.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        aria-label="Selecionar CSV da coleção"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="mt-3"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? "Importando…" : "Selecionar CSV"}
      </Button>
      {report && <p className="mt-2 text-xs text-luxury-mist">{report}</p>}
    </div>
  );
}
