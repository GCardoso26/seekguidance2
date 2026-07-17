"use client";

import { useMutation } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/async-state";

const HISTORY_KEY = "judgetcg.inventory.importHistory";
const MAX_CSV_BYTES = 8 * 1024 * 1024;

type Step = 1 | 2 | 3;

type Props = {
  onImported: () => void;
};

async function readCsvFile(file: File): Promise<string> {
  if (file.size > MAX_CSV_BYTES) {
    throw new Error("Arquivo muito grande (máx. 8 MB)");
  }
  const buf = await file.arrayBuffer();
  const asUtf8 = new TextDecoder("utf-8", { fatal: false }).decode(buf);
  if (!asUtf8.includes("\uFFFD")) {
    return asUtf8.replace(/^\uFEFF/, "");
  }
  // Export Liga costuma vir em Latin-1 / Windows-1252
  return new TextDecoder("iso-8859-1").decode(buf);
}

export function InventoryImportWizard({ onImported }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>(1);
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [readingFile, setReadingFile] = useState(false);
  const [preview, setPreview] = useState<Array<Record<string, unknown>>>([]);
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
    errors: string[];
    dry_run?: boolean;
    format?: string;
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
        format?: string;
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

  async function handleFileChange(fileList: FileList | null) {
    setFileError(null);
    const file = fileList?.[0];
    if (!file) return;
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".csv") && file.type && !file.type.includes("csv") && file.type !== "text/plain") {
      setFileError("Selecione um arquivo .csv");
      return;
    }
    setReadingFile(true);
    try {
      const text = await readCsvFile(file);
      if (!text.trim()) {
        setFileError("Arquivo CSV vazio");
        setCsv("");
        setFileName(null);
        return;
      }
      setCsv(text);
      setFileName(file.name);
    } catch (err) {
      setCsv("");
      setFileName(null);
      setFileError(err instanceof Error ? err.message : "Falha ao ler o arquivo");
    } finally {
      setReadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function resetImport() {
    setStep(1);
    setCsv("");
    setFileName(null);
    setFileError(null);
    setPreview([]);
    setResult(null);
  }

  return (
    <div id="import" className="scroll-mt-24 space-y-4 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-foreground">Importação CSV</h3>
        <p className="text-xs text-muted-foreground">Passo {step}/3 · Rollback não suportado nesta sprint</p>
      </div>

      {step === 1 ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Envie o arquivo .csv (JudgeTCG ou export LigaLorcana). Não é necessário colar o conteúdo.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv,text/plain"
            className="sr-only"
            data-testid="inventory-csv-file-input"
            onChange={(e) => void handleFileChange(e.target.files)}
          />

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              disabled={readingFile || importMut.isPending}
              onClick={() => fileInputRef.current?.click()}
              data-testid="inventory-csv-pick-file"
            >
              <Upload className="mr-2 size-4" aria-hidden />
              {readingFile ? "Lendo arquivo…" : "Selecionar arquivo CSV"}
            </Button>
            {fileName ? (
              <p className="text-sm text-foreground" data-testid="inventory-csv-file-name">
                {fileName}
                <span className="ml-2 text-xs text-muted-foreground">
                  ({Math.ceil(csv.length / 1024)} KB)
                </span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum arquivo selecionado</p>
            )}
          </div>

          {fileError ? <InlineAlert message={fileError} tone="error" /> : null}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={!csv.trim() || importMut.isPending || readingFile}
              onClick={() => importMut.mutate(true)}
              data-testid="inventory-csv-preview"
            >
              Preview (dry-run)
            </Button>
            {fileName ? (
              <Button type="button" variant="ghost" onClick={resetImport}>
                Limpar
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {fileName ? `${fileName} · ` : ""}
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
            {result.format ? ` · Formato: ${result.format}` : ""}
          </p>
          {result.errors?.length ? (
            <InlineAlert message={result.errors.slice(0, 3).join("; ")} tone="warning" />
          ) : null}
          <Button type="button" variant="secondary" onClick={resetImport}>
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
