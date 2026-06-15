import { apiFetch, ApiError, resolveApiUrl } from "@/services/api/client";
import type { BackendHealthState, JudgeGameCatalogItem, JudgeQuestionPayload, JudgeResponse } from "@/types/judge";

type JudgeHealthPayload = {
  status?: string;
  integrity_status?: string;
};

export function mapHealthStatus(data?: JudgeHealthPayload | null): BackendHealthState {
  if (!data) return "offline";
  const status = (data.status || "").toLowerCase();
  const integrity = (data.integrity_status || "").toLowerCase();
  if (status === "ok" && integrity === "ok") return "online";
  if (status === "ok" || integrity === "ok") return "degraded";
  return "offline";
}

export async function getJudgeHealth(): Promise<BackendHealthState> {
  try {
    const data = await apiFetch<JudgeHealthPayload>("/runtime/judge/health", { publicRoute: true });
    return mapHealthStatus(data);
  } catch {
    try {
      const data = await apiFetch<JudgeHealthPayload>("/v1/health", { publicRoute: true });
      return mapHealthStatus(data);
    } catch {
      return "offline";
    }
  }
}

export type JudgeQualityPayload = {
  integrity_status: string;
  window_days: number;
  games: Array<{
    game_slug: string;
    thumbs_up_pct?: number | null;
    thumbs_down_pct?: number | null;
    questions_per_day?: number;
    confidence_avg?: number | null;
    alert?: string;
    alert_active?: boolean;
  }>;
  trends?: Record<string, { label: string; games_tracked?: number }>;
  cache: { cache_hit_rate?: number; hits?: number; misses?: number };
  latency: Record<string, { p50: number; p95: number; p99: number }>;
};

export async function getJudgeQuality(days = 7): Promise<JudgeQualityPayload> {
  return apiFetch<JudgeQualityPayload>(`/runtime/judge/quality?days=${days}`, {
    publicRoute: true,
  });
}

export type JudgeQualityMetricsPayload = {
  generated_at: string;
  games: Record<
    string,
    {
      queries_24h?: number;
      thumbs_up_pct?: number | null;
      thumbs_down_pct?: number | null;
      confidence_avg?: number | null;
      cache_hit_rate?: number;
      alert_active?: boolean;
      latency_p50_ms?: number;
      latency_p95_ms?: number;
      latency_p99_ms?: number;
      latency_by_phase?: {
        embedding_ms?: number;
        hyde_ms?: number;
        retrieval_ms?: number;
        reranking_ms?: number;
        generation_ms?: number;
      };
    }
  >;
  alerts: string[];
};

export async function getJudgeQualityMetrics(days = 7): Promise<JudgeQualityMetricsPayload> {
  return apiFetch<JudgeQualityMetricsPayload>(`/runtime/judge/quality-metrics?days=${days}`, {
    publicRoute: true,
  });
}

export async function getJudgeGames(): Promise<JudgeGameCatalogItem[]> {
  const data = await apiFetch<{ games: JudgeGameCatalogItem[] }>("/runtime/judge/games", {
    publicRoute: true,
  });
  return data.games ?? [];
}

export async function askJudgeQuestion(payload: JudgeQuestionPayload): Promise<JudgeResponse> {
  const body = {
    tcg: payload.tcg,
    question: payload.question,
    context: payload.context,
  };

  if (typeof window !== "undefined") {
    const res = await fetch("/api/judge/query", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (!res.ok) {
      const errBody = (await res.json().catch(() => ({}))) as { detail?: string };
      throw new ApiError(errBody.detail || `API ${res.status}`, res.status, errBody);
    }
    return res.json() as Promise<JudgeResponse>;
  }

  return apiFetch<JudgeResponse>("/runtime/judge/query", {
    method: "POST",
    publicRoute: true,
    body,
  });
}

export type JudgePhaseEvent = {
  type: "phase";
  phase: "embedding" | "retrieving" | "reranking" | "generating";
  label: string;
};

export interface JudgeFeedbackPayload {
  question: string;
  game_slug: string;
  verdict?: string;
  rating: "positive" | "negative";
  comment?: string;
}

export async function submitJudgeFeedback(payload: JudgeFeedbackPayload): Promise<void> {
  try {
    await fetch(resolveApiUrl("/runtime/judge/feedback", { publicRoute: true }), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    /* best-effort */
  }
}

export type JudgeStreamCallbacks = {
  onToken: (text: string) => void;
  onDone: (response: JudgeResponse) => void;
  onError: (message: string) => void;
  onPhase?: (event: JudgePhaseEvent) => void;
};

function parseSseBlock(block: string): Record<string, unknown> | null {
  const line = block
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.startsWith("data:"));
  if (!line) return null;
  const json = line.slice(5).trim();
  if (!json) return null;
  try {
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Returns true if stream completed; false if endpoint unavailable (caller may fallback). */
export async function askJudgeQuestionStream(
  payload: JudgeQuestionPayload,
  callbacks: JudgeStreamCallbacks,
  signal?: AbortSignal,
): Promise<boolean> {
  const body = {
    tcg: payload.tcg,
    question: payload.question,
    context: payload.context,
  };

  const url =
    typeof window !== "undefined"
      ? "/api/judge/query/stream"
      : resolveApiUrl("/runtime/judge/query/stream", { publicRoute: true });
  let res: Response;

  try {
    res = await fetch(url, {
      method: "POST",
      credentials: typeof window !== "undefined" ? "include" : undefined,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal,
    });
  } catch (e) {
    if (signal?.aborted) return false;
    throw new ApiError("Network error — API unreachable", 0, e);
  }

  if (res.status === 404 || res.status === 405) return false;
  if (!res.ok || !res.body) {
    const errBody = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new ApiError(errBody.detail || `API ${res.status}`, res.status, errBody);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finished = false;

  while (!finished) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const event = parseSseBlock(part);
      if (!event) continue;

      if (event.type === "phase" && typeof event.label === "string") {
        callbacks.onPhase?.({
          type: "phase",
          phase: (event.phase as JudgePhaseEvent["phase"]) || "retrieving",
          label: String(event.label),
        });
      } else if (event.type === "token" && typeof event.text === "string") {
        callbacks.onToken(event.text);
      } else if (event.type === "done") {
        const { type: _t, ...rest } = event;
        callbacks.onDone(rest as JudgeResponse);
        finished = true;
      } else if (event.type === "error") {
        callbacks.onError(String(event.message || "Erro ao processar a consulta."));
        finished = true;
      }
    }
  }

  return true;
}

/** Tenta streaming; se indisponível, usa POST JSON clássico. */
export async function askJudgeQuestionPreferStream(
  payload: JudgeQuestionPayload,
  callbacks: Pick<JudgeStreamCallbacks, "onToken" | "onDone" | "onPhase">,
  signal?: AbortSignal,
): Promise<JudgeResponse> {
  let finalResponse: JudgeResponse | null = null;

  try {
    const streamed = await askJudgeQuestionStream(
      payload,
      {
        onToken: callbacks.onToken,
        onPhase: callbacks.onPhase,
        onDone: (response) => {
          finalResponse = response;
          callbacks.onDone(response);
        },
        onError: (message) => {
          throw new ApiError(message, 500);
        },
      },
      signal,
    );
    if (streamed && finalResponse) return finalResponse;
  } catch (e) {
    if (e instanceof ApiError && e.status === 0) throw e;
  }

  const response = await askJudgeQuestion(payload);
  const text = response.explanation || response.answer;
  if (text) callbacks.onToken(text);
  callbacks.onDone(response);
  return response;
}

export function judgeErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 0) return "Não foi possível contactar o servidor. Verifique a ligação.";
    if (err.status === 429) return "Limite diário de consultas atingido. Faça upgrade para continuar.";
    if (err.status === 403) return err.message || "Este recurso requer plano Spike.";
    return err.message || "Erro ao processar a consulta.";
  }
  if (err instanceof Error) return err.message;
  return "Erro inesperado. Tente novamente.";
}
