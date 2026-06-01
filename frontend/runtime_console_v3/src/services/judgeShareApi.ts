import { apiFetch } from "@/services/api/client";
import type { JudgeResponse, TcgType } from "@/types/judge";

export type JudgeSharePayload = {
  id: string;
  tcg: string;
  question: string;
  response: JudgeResponse;
  signature: string | null;
};

export async function createJudgeShare(
  tcg: TcgType,
  question: string,
  response: JudgeResponse,
): Promise<JudgeSharePayload | null> {
  try {
    return await apiFetch<JudgeSharePayload>("/runtime/judge/share", {
      method: "POST",
      publicRoute: true,
      body: { tcg, question, response },
    });
  } catch {
    return null;
  }
}

export async function fetchJudgeShare(shareId: string, sig?: string | null): Promise<JudgeSharePayload | null> {
  try {
    const qs = sig ? `?sig=${encodeURIComponent(sig)}` : "";
    return await apiFetch<JudgeSharePayload>(`/runtime/judge/share/${shareId}${qs}`, {
      publicRoute: true,
    });
  } catch {
    return null;
  }
}

export function buildSignedShareUrl(shareId: string, signature: string | null): string {
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://judgetcg.com.br");
  const params = new URLSearchParams({ share: shareId });
  if (signature) params.set("sig", signature);
  return `${base}/judge?${params.toString()}`;
}
