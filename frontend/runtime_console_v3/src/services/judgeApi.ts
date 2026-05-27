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
    const data = await apiFetch<JudgeHealthPayload>("/runtime/judge/health");
    return mapHealthStatus(data);
  } catch {
    try {
      const data = await apiFetch<JudgeHealthPayload>("/v1/health");
      return mapHealthStatus(data);
    } catch {
      return "offline";
    }
  }
}

export async function getJudgeGames(): Promise<JudgeGameCatalogItem[]> {
  const data = await apiFetch<{ games: JudgeGameCatalogItem[] }>("/runtime/judge/games");
  return data.games ?? [];
}

export async function askJudgeQuestion(payload: JudgeQuestionPayload): Promise<JudgeResponse> {
  return apiFetch<JudgeResponse>("/runtime/judge/query", {
    method: "POST",
    body: {
      tcg: payload.tcg,
      question: payload.question,
      context: payload.context,
    },
  });
}

export type JudgeStreamCallbacks = {
  onToken: (text: string) => void;
  onDone: (response: JudgeResponse) => void;
  onError: (message: string) => void;
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
  const url = resolveApiUrl("/runtime/judge/query/stream");
  let res: Response;

  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tcg: payload.tcg,
        question: payload.question,
        context: payload.context,
      }),
      cache: "no-store",
      signal,
    });
  } catch (e) {
    if (signal?.aborted) return false;
    throw new ApiError("Network error — API unreachable", 0, e);
  }

  if (res.status === 404 || res.status === 405) return false;
  if (!res.ok || !res.body) {
    throw new ApiError(`API ${res.status}`, res.status);
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

      if (event.type === "token" && typeof event.text === "string") {
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
  callbacks: Pick<JudgeStreamCallbacks, "onToken" | "onDone">,
  signal?: AbortSignal,
): Promise<JudgeResponse> {
  let finalResponse: JudgeResponse | null = null;

  try {
    const streamed = await askJudgeQuestionStream(
      payload,
      {
        onToken: callbacks.onToken,
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
    if (err.status === 429) return "Muitas perguntas em pouco tempo. Aguarde um momento.";
    return err.message || "Erro ao processar a consulta.";
  }
  if (err instanceof Error) return err.message;
  return "Erro inesperado. Tente novamente.";
}
