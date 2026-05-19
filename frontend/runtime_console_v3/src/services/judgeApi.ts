import { apiFetch, ApiError } from "@/services/api/client";
import type { BackendHealthState, JudgeQuestion, JudgeResponse } from "@/types/judge";

type HealthPayload = {
  status?: string;
  integrity_status?: string;
};

export function mapHealthStatus(data?: HealthPayload | null): BackendHealthState {
  if (!data) return "offline";
  const status = (data.status || "").toLowerCase();
  const integrity = (data.integrity_status || "").toLowerCase();
  if (status === "ok" && integrity === "ok") return "online";
  if (status === "ok" || integrity === "ok") return "degraded";
  return "offline";
}

export async function getJudgeHealth(): Promise<BackendHealthState> {
  try {
    const data = await apiFetch<HealthPayload>("/health");
    return mapHealthStatus(data);
  } catch {
    return "offline";
  }
}

export async function askJudgeQuestion(payload: JudgeQuestion): Promise<JudgeResponse> {
  return apiFetch<JudgeResponse>("/runtime/judge/query", {
    method: "POST",
    body: { tcg: payload.tcg, question: payload.question },
  });
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
