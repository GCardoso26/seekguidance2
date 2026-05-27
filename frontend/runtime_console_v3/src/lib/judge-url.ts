import type { TcgType } from "@/types/judge";
import { TCG_OPTIONS } from "@/types/judge";

const TCG_IDS = new Set(TCG_OPTIONS.map((o) => o.id));

export function isValidTcgType(value: string | null | undefined): value is TcgType {
  return Boolean(value && TCG_IDS.has(value as TcgType));
}

export function parseJudgeSearchParams(params: URLSearchParams): {
  tcg: TcgType | null;
  question: string | null;
} {
  const gameRaw = params.get("game") ?? params.get("tcg");
  const qRaw = params.get("q") ?? params.get("question");
  return {
    tcg: isValidTcgType(gameRaw) ? gameRaw : null,
    question: qRaw?.trim() ? qRaw.trim() : null,
  };
}

export function buildJudgeShareUrl(tcg: TcgType, question: string): string {
  if (typeof window === "undefined") {
    const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://judgetcg.com.br";
    const params = new URLSearchParams({ game: tcg, q: question.trim() });
    return `${base}/judge?${params.toString()}`;
  }
  const params = new URLSearchParams({ game: tcg, q: question.trim() });
  return `${window.location.origin}/judge?${params.toString()}`;
}

export function buildJudgeUrlParams(tcg: TcgType, question?: string): URLSearchParams {
  const params = new URLSearchParams({ game: tcg });
  const q = question?.trim();
  if (q) params.set("q", q);
  return params;
}
