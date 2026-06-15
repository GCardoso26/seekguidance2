import { ApiError } from "@/services/api/client";
import type { JudgeHistoryItem, JudgeResponse, TcgType } from "@/types/judge";

export type JudgeSessionPayload = {
  id: string;
  tcg: string;
  title: string | null;
  allow_anonymous_read: boolean;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    payload: Record<string, unknown>;
    created_at?: string | null;
  }>;
};

async function sessionFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    cache: "no-store",
    ...init,
  });
  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new ApiError(errBody.detail || `API ${res.status}`, res.status, errBody);
  }
  return res.json() as Promise<T>;
}

export async function fetchJudgeSession(sessionId: string): Promise<JudgeSessionPayload | null> {
  try {
    return await sessionFetch<JudgeSessionPayload>(`/api/judge/session/${sessionId}`);
  } catch {
    return null;
  }
}

export async function saveJudgeSession(
  tcg: TcgType,
  items: JudgeHistoryItem[],
  allowAnonymousRead = false,
): Promise<string | null> {
  try {
    const data = await sessionFetch<JudgeSessionPayload>("/api/judge/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tcg,
        title: items[0]?.question?.slice(0, 80) ?? "Conversa Judge",
        allow_anonymous_read: allowAnonymousRead,
        messages: items.flatMap((item) => [
          { role: "user", content: item.question, payload: { tcg: item.tcg } },
          {
            role: "assistant",
            content: item.answer,
            payload: {
              success: item.success,
              confidence: item.confidence,
              sources: item.sources,
              verdict: item.verdict,
              rule_applied: item.rule_applied,
            } satisfies Partial<JudgeResponse>,
          },
        ]),
      }),
    });
    return data.id;
  } catch {
    return null;
  }
}

export function sessionToHistoryItems(session: JudgeSessionPayload): JudgeHistoryItem[] {
  const tcg = session.tcg as TcgType;
  const items: JudgeHistoryItem[] = [];
  for (let i = 0; i < session.messages.length; i += 2) {
    const userMsg = session.messages[i];
    const assistantMsg = session.messages[i + 1];
    if (!userMsg || userMsg.role !== "user") continue;
    const payload = (assistantMsg?.payload ?? {}) as Record<string, unknown>;
    items.push({
      id: assistantMsg?.id ?? userMsg.id,
      tcg,
      question: userMsg.content,
      answer: assistantMsg?.content ?? "",
      success: Boolean(payload.success ?? true),
      confidence: Number(payload.confidence ?? 0),
      sources: (payload.sources as JudgeHistoryItem["sources"]) ?? [],
      verdict: (payload.verdict as string | null) ?? null,
      rule_applied: (payload.rule_applied as string | null) ?? null,
      createdAt: assistantMsg?.created_at ?? new Date().toISOString(),
    });
  }
  return items;
}
