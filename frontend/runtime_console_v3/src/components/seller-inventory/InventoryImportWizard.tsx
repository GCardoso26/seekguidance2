"use client";

import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/async-state";

const HISTORY_KEY = "judgetcg.inventory.importHistory";

type Step = 1 | 2 | 3;

type Props = {
  onImported: () => void;
};

export function InventoryImportWizard({ onImported }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<Array<Record<string, unknown>>>([]);
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
    errors: string[];
    dry_run?: boolean;
  } | null>(null);

  const history = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]") as Array<{
        at: string;
        imported: number;
      }>;
    } catch {
      return [];
    }
  }, [result]);

  const importMut = useMutation({
    mutationFn: async (dryRun: boolean) => {
      const res = await fetch("/api/seller/inventory/import-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv, dry_run: dryRun }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(String((data as { detail?: string }).detail ?? "Falha na importação"));
      return data as {
        imported: number;
        skipped: number;
        errors: string[];
        dry_run?: boolean;
        preview?: Array<Record<string, unknown>>;
        rollback_supported?: boolean;
      };
    },
    onSuccess: (data, dryRun) => {
      if (dryRun) {
        setPreview(data.preview ?? []);
        setStep(2);
        return;
      }
      setResult(data);
      setStep(3);
      try {
        const prev = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]") as Array<{
          at: string;
          imported: number;
        }>;
        prev.unshift({ at: new Date().toISOString(), imported: data.imported });
        localStorage.setItem(HISTORY_KEY, JSON.stringify(prev.slice(0, 10)));
      } catch {
        /* ignore */
      }
      onImported();
    },
  });

  return (
    <div id="import" className="scroll-mt-24 space-y-4 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-foreground">Importação CSV</h3>
        <p className="text-xs text-muted-foreground">Passo {step}/3 · Rollback não suportado nesta sprint</p>
      </div>

      {step === 1 ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Colunas: name, category, price_cents, stock, sku, description
          </p>
          <textarea
            className="min-h-32 w-full rounded-md border border-input bg-background p-3 font-mono text-xs text-foreground"
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            placeholder="name,category,price_cents,stock,sku&#10;Sleeve,sleeve,3490,10,SLV-01"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={!csv.trim() || importMut.isPending}
              onClick={() => importMut.mutate(true)}
            >
              Preview (dry-run)
            </Button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Mapeamento automático · {preview.length} linha(s) válidas no preview
          </p>
          <div className="max-h-48 overflow-auto rounded-lg border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-2 py-1">Linha</th>
                  <th className="px-2 py-1">Nome</th>
                  <th className="px-2 py-1">Cat.</th>
                  <th className="px-2 py-1">Preço</th>
                  <th className="px-2 py-1">Estoque</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 20).map((row) => (
                  <tr key={String(row.line)} className="border-t border-border/60">
                    <td className="px-2 py-1">{String(row.line)}</td>
                    <td className="px-2 py-1">{String(row.name)}</td>
                    <td className="px-2 py-1">{String(row.category)}</td>
                    <td className="px-2 py-1">{String(row.price_cents)}</td>
                    <td className="px-2 py-1">{String(row.stock)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep(1)}>
              Voltar
            </Button>
            <Button type="button" disabled={importMut.isPending} onClick={() => importMut.mutate(false)}>
              Confirmar importação
            </Button>
          </div>
        </div>
      ) : null}

      {step === 3 && result ? (
        <div className="space-y-2 text-sm">
          <p className="text-foreground">
            Importados: {result.imported} · Ignorados: {result.skipped}
          </p>
          {result.errors?.length ? (
            <InlineAlert message={result.errors.slice(0, 3).join("; ")} tone="warning" />
          ) : null}
          <Button type="button" variant="secondary" onClick={() => { setStep(1); setCsv(""); setResult(null); }}>
            Nova importação
          </Button>
        </div>
      ) : null}

      {importMut.isError ? (
        <InlineAlert message={(importMut.error as Error).message} tone="error" />
      ) : null}

      {history.length > 0 ? (
        <div className="border-t border-border pt-3 text-xs text-muted-foreground">
          Histórico local:{" "}
          {history
            .slice(0, 3)
            .map((h) => `${new Date(h.at).toLocaleString("pt-BR")} (${h.imported})`)
            .join(" · ")}
        </div>
      ) : null}
    </div>
  );
}
