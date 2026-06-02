import { apiFetch } from "@/services/api/client";

export type WarmupStatus = {
  embedding_ready: boolean;
  reranker_ready: boolean;
  cache_ready: boolean;
  judge_ready: boolean;
};

export type InfrastructurePayload = {
  operational_health_score: number;
  warmup: Record<string, unknown>;
  judge_metrics: Record<string, unknown>;
  cache_hit_rate: number;
  degraded_mode: Record<string, boolean>;
  dependencies: Record<string, string>;
  ingestion_queue_pending: number;
};

export async function getWarmupStatus(): Promise<WarmupStatus> {
  return apiFetch<WarmupStatus>("/runtime/warmup", { publicRoute: true });
}

export async function getInfrastructure(): Promise<InfrastructurePayload> {
  return apiFetch<InfrastructurePayload>("/runtime/infrastructure");
}

export type IngestionGameStatus = {
  game_slug: string;
  display_name: string;
  chunk_count: number;
  rule_atoms: number;
  corpus_size: number;
  rag_ready: boolean;
  coverage_pct: number;
  last_indexed_at?: string | null;
};

export async function getIngestionStatus(): Promise<{ games: IngestionGameStatus[] }> {
  return apiFetch("/runtime/admin/ingestion/status");
}

export async function getIngestionJobs(): Promise<{ jobs: unknown[] }> {
  return apiFetch("/runtime/admin/ingestion/jobs");
}

export async function reindexGame(gameSlug: string): Promise<{ job_id?: string; status: string }> {
  return apiFetch("/runtime/admin/ingestion/reindex", {
    method: "POST",
    body: { game_slug: gameSlug },
  });
}

export async function getIngestionErrors(params?: {
  game_slug?: string;
  stage?: string;
}): Promise<{ errors: unknown[] }> {
  const qs = new URLSearchParams();
  if (params?.game_slug) qs.set("game_slug", params.game_slug);
  if (params?.stage) qs.set("stage", params.stage);
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiFetch(`/runtime/admin/ingestion/errors${suffix}`);
}

export type IngestionUploadResult = {
  status: string;
  upload?: Record<string, unknown>;
  note?: string;
};

export async function uploadIngestionPdf(
  gameSlug: string,
  file: File,
): Promise<IngestionUploadResult> {
  const form = new FormData();
  form.append("file", file);
  form.append("game_slug", gameSlug);
  const res = await fetch("/api/bff/runtime/admin/ingestion/upload", {
    method: "POST",
    body: form,
    credentials: "include",
  });
  const text = await res.text();
  let data: IngestionUploadResult = { status: "error" };
  if (text) {
    try {
      data = JSON.parse(text) as IngestionUploadResult;
    } catch {
      data = { status: "error", note: text };
    }
  }
  if (!res.ok) {
    throw new Error((data as { detail?: string }).detail ?? `Upload falhou (${res.status})`);
  }
  return data;
}
