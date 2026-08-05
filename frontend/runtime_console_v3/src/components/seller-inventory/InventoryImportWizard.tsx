"use client";

import { useMutation } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/async-state";

const HISTORY_KEY = "judgetcg.inventory.importHistory";
const MAX_CSV_BYTES = 8 * 1024 * 1024;
/** Linhas de dados por request no commit (evita 504 no gateway). */
const COMMIT_CHUNK_ROWS = 250;

type Step = 1 | 2 | 3;

type Props = {
  onImported: () => void;
};

type ImportResult = {
  imported: number;
  updated?: number;
  skipped: number;
  errors: string[];
  dry_run?: boolean;
  format?: string;
  preview?: Array<Record<string, unknown>>;
  catalog_matched?: number | null;
  catalog_unmatched?: number | null;
  rollback_supported?: boolean;
  duplicates?: Array<{
    line?: number;
    name?: string;
    sku?: string | null;
    foil?: boolean;
    incoming_stock?: number;
    existing_stock?: number;
    merged_stock?: number;
    existing_id?: string;
  }>;
  duplicates_count?: number;
  needs_confirmation?: boolean;
  message?: string;
};

type OnDuplicate = "ask" | "merge" | "skip";

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

function looksLikeCsvHeader(line: string): boolean {
  const lower = line.toLowerCase();
  if (lower.includes("name") && lower.includes("category")) return true;
  if (lower.includes("card name") || lower.includes("cardname") || lower.includes("card_name")) return true;
  if (lower.includes("sku") && (lower.includes("price") || lower.includes("preço") || lower.includes("preco"))) {
    return true;
  }
  if (lower.includes("set") && lower.includes("rarity") && lower.includes(",")) return true;
  return false;
}

/** Parte o CSV em lotes com o mesmo cabeçalho (e preâmbulo, se houver). */
function splitCsvForCommit(csvText: string, maxDataRows: number): string[] {
  const normalized = csvText.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n");
  let headerIdx = -1;
  for (let i = 0; i < Math.min(lines.length, 60); i++) {
    const line = lines[i];
    if (!line?.trim()) continue;
    if (looksLikeCsvHeader(line)) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx < 0) {
    headerIdx = lines.findIndex((l) => l.trim().includes(","));
  }
  if (headerIdx < 0) return [csvText];

  const preamble = lines.slice(0, headerIdx).join("\n");
  const header = lines[headerIdx];
  const dataLines = lines.slice(headerIdx + 1).filter((l) => l.trim().length > 0);
  if (dataLines.length <= maxDataRows) return [csvText];

  const chunks: string[] = [];
  for (let i = 0; i < dataLines.length; i += maxDataRows) {
    const slice = dataLines.slice(i, i + maxDataRows);
    const body = preamble.trim()
      ? [preamble, header, ...slice].join("\n")
      : [header, ...slice].join("\n");
    chunks.push(body);
  }
  return chunks;
}

async function postImportCsv(
  csvChunk: string,
  dryRun: boolean,
  onDuplicate: OnDuplicate = "ask",
): Promise<ImportResult> {
  const res = await fetch("/api/seller/inventory/import-csv", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ csv: csvChunk, dry_run: dryRun, on_duplicate: onDuplicate }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = (data as { detail?: unknown }).detail;
    const msg =
      typeof detail === "string"
        ? detail
        : detail && typeof detail === "object" && "message" in (detail as object)
          ? String((detail as { message?: string }).message)
          : `Falha na importação (HTTP ${res.status})`;
    throw new Error(msg);
  }
  return data as ImportResult;
}

export function InventoryImportWizard({ onImported }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>(1);
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [readingFile, setReadingFile] = useState(false);
  const [preview, setPreview] = useState<Array<Record<string, unknown>>>([]);
  const [duplicates, setDuplicates] = useState<ImportResult["duplicates"]>([]);
  const [onDuplicate, setOnDuplicate] = useState<OnDuplicate>("merge");
  const [chunkProgress, setChunkProgress] = useState<string | null>(null);
  const [result, setResult] = useState<{
    imported: number;
    updated?: number;
    skipped: number;
    errors: string[];
    dry_run?: boolean;
    format?: string;
    catalog_matched?: number | null;
    catalog_unmatched?: number | null;
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
      if (dryRun) {
        setChunkProgress(null);
        return postImportCsv(csv, true, "ask");
      }

      const mode: OnDuplicate = duplicates && duplicates.length > 0 ? onDuplicate : "skip";
      const chunks = splitCsvForCommit(csv, COMMIT_CHUNK_ROWS);
      let imported = 0;
      let updated = 0;
      let skipped = 0;
      const errors: string[] = [];
      let format: string | undefined;
      let catalogMatched = 0;
      let catalogUnmatched = 0;
      let hasCatalogStats = false;

      for (let i = 0; i < chunks.length; i++) {
        setChunkProgress(
          chunks.length > 1 ? `Importando lote ${i + 1}/${chunks.length}…` : "Importando…",
        );
        const data = await postImportCsv(chunks[i], false, mode);
        if (data.needs_confirmation) {
          throw new Error(
            data.message ||
              "Há cartas duplicadas. Escolha se deseja somar ou ignorar antes de confirmar.",
          );
        }
        imported += data.imported ?? 0;
        updated += data.updated ?? 0;
        skipped += data.skipped ?? 0;
        if (data.errors?.length) errors.push(...data.errors);
        format = data.format ?? format;
        if (typeof data.catalog_matched === "number") {
          hasCatalogStats = true;
          catalogMatched += data.catalog_matched;
        }
        if (typeof data.catalog_unmatched === "number") {
          hasCatalogStats = true;
          catalogUnmatched += data.catalog_unmatched;
        }
      }

      setChunkProgress(null);
      return {
        imported,
        updated,
        skipped,
        errors: errors.slice(0, 50),
        dry_run: false,
        format,
        catalog_matched: hasCatalogStats ? catalogMatched : null,
        catalog_unmatched: hasCatalogStats ? catalogUnmatched : null,
        rollback_supported: false,
      } satisfies ImportResult;
    },
    onSuccess: (data, dryRun) => {
      if (dryRun) {
        setPreview(data.preview ?? []);
        setDuplicates(data.duplicates ?? []);
        setOnDuplicate("merge");
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
        prev.unshift({ at: new Date().toISOString(), imported: data.imported + (data.updated ?? 0) });
        localStorage.setItem(HISTORY_KEY, JSON.stringify(prev.slice(0, 10)));
      } catch {
        /* ignore */
      }
      onImported();
    },
    onSettled: () => {
      setChunkProgress(null);
    },
  });

  const backfillMut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/seller/inventory/backfill-liga-images", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data?.detail === "string"
            ? data.detail
            : data?.error || `Backfill falhou (${res.status})`,
        );
      }
      return data as { updated?: number; unmatched?: number; scanned?: number };
    },
    onSuccess: () => {
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
    setDuplicates([]);
    setOnDuplicate("merge");
    setResult(null);
    setChunkProgress(null);
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
            Arquivos grandes são enviados em lotes de {COMMIT_CHUNK_ROWS} linhas.
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
            {duplicates && duplicates.length > 0
              ? ` · ${duplicates.length} já existem no estoque`
              : ""}
          </p>
          <div className="max-h-48 overflow-auto rounded-lg border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-2 py-1">Linha</th>
                  <th className="px-2 py-1">Nome</th>
                  <th className="px-2 py-1">Foil</th>
                  <th className="px-2 py-1">Preço</th>
                  <th className="px-2 py-1">Estoque</th>
                  <th className="px-2 py-1">Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 20).map((row) => (
                  <tr key={String(row.line)} className="border-t border-border/60">
                    <td className="px-2 py-1">{String(row.line)}</td>
                    <td className="px-2 py-1">{String(row.name)}</td>
                    <td className="px-2 py-1">{row.foil ? "★" : "—"}</td>
                    <td className="px-2 py-1">{String(row.price_cents)}</td>
                    <td className="px-2 py-1">{String(row.stock)}</td>
                    <td className="px-2 py-1">
                      {row.already_exists
                        ? `Já existe (${String(row.existing_stock ?? 0)})`
                        : "Nova"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {duplicates && duplicates.length > 0 ? (
            <div className="space-y-2 rounded-lg border border-warning/40 bg-warning/5 p-3">
              <p className="text-sm font-medium text-foreground">
                {duplicates.length} carta(s) já existem no estoque
              </p>
              <p className="text-xs text-muted-foreground">
                ★ = foil. Escolha se deseja somar a quantidade importada ao estoque atual ou
                ignorar essas linhas.
              </p>
              <div className="max-h-36 overflow-auto rounded border border-border/60 bg-card text-xs">
                <table className="w-full text-left">
                  <thead className="bg-muted/40 text-muted-foreground">
                    <tr>
                      <th className="px-2 py-1">Carta</th>
                      <th className="px-2 py-1">Atual</th>
                      <th className="px-2 py-1">CSV</th>
                      <th className="px-2 py-1">Soma</th>
                    </tr>
                  </thead>
                  <tbody>
                    {duplicates.slice(0, 30).map((d) => (
                      <tr key={`${d.existing_id}-${d.line}`} className="border-t border-border/60">
                        <td className="px-2 py-1">
                          {d.name}
                          {d.foil ? " ★" : ""}
                        </td>
                        <td className="px-2 py-1">{d.existing_stock}</td>
                        <td className="px-2 py-1">{d.incoming_stock}</td>
                        <td className="px-2 py-1">{d.merged_stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <fieldset className="flex flex-wrap gap-3 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="on-duplicate"
                    checked={onDuplicate === "merge"}
                    onChange={() => setOnDuplicate("merge")}
                  />
                  Somar quantidades e continuar
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="on-duplicate"
                    checked={onDuplicate === "skip"}
                    onChange={() => setOnDuplicate("skip")}
                  />
                  Ignorar cartas já existentes
                </label>
              </fieldset>
            </div>
          ) : null}

          {chunkProgress ? (
            <p className="text-sm text-muted-foreground" data-testid="inventory-csv-chunk-progress">
              {chunkProgress}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" disabled={importMut.isPending} onClick={() => setStep(1)}>
              Voltar
            </Button>
            <Button type="button" disabled={importMut.isPending} onClick={() => importMut.mutate(false)}>
              {importMut.isPending
                ? "Importando…"
                : duplicates && duplicates.length > 0
                  ? onDuplicate === "merge"
                    ? "Confirmar e somar existentes"
                    : "Confirmar (ignorando existentes)"
                  : "Confirmar importação"}
            </Button>
          </div>
        </div>
      ) : null}

      {step === 3 && result ? (
        <div className="space-y-2 text-sm">
          <p className="text-foreground">
            Importados: {result.imported}
            {typeof result.updated === "number" ? ` · Atualizados (soma): ${result.updated}` : ""}
            {" · "}Ignorados: {result.skipped}
            {result.format ? ` · Formato: ${result.format}` : ""}
          </p>
          {typeof result.catalog_matched === "number" || typeof result.catalog_unmatched === "number" ? (
            <p className="text-xs text-muted-foreground">
              Catálogo: {result.catalog_matched ?? 0} com match · {result.catalog_unmatched ?? 0} sem imagem/catálogo
            </p>
          ) : null}
          {result.errors?.length ? (
            <InlineAlert message={result.errors.slice(0, 3).join("; ")} tone="warning" />
          ) : null}
          {backfillMut.isSuccess ? (
            <p className="text-xs text-muted-foreground">
              Backfill: {backfillMut.data?.updated ?? 0} atualizados
              {typeof backfillMut.data?.unmatched === "number"
                ? ` · ${backfillMut.data.unmatched} sem match`
                : ""}
            </p>
          ) : null}
          {backfillMut.isError ? (
            <InlineAlert message={(backfillMut.error as Error).message} tone="error" />
          ) : null}
          <div className="flex flex-wrap gap-2">
            {(result.format === "liga_lorcana" || (result.catalog_unmatched ?? 0) > 0) && (
              <Button
                type="button"
                variant="secondary"
                disabled={backfillMut.isPending}
                onClick={() => backfillMut.mutate()}
                data-testid="inventory-csv-backfill-liga"
              >
                {backfillMut.isPending ? "Religando imagens…" : "Religar imagens Liga"}
              </Button>
            )}
            <Button type="button" variant="secondary" onClick={resetImport}>
              Nova importação
            </Button>
          </div>
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
