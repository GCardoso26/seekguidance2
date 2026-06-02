import { apiFetch } from "@/services/api/client";
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

export async function fetchJudgeSession(
  sessionId: string,
  userId?: string | null,
): Promise<JudgeSessionPayload | null> {
  try {
    const headers: Record<string, string> = {};
    if (userId) headers["X-Judge-User-Id"] = userId;
    return await apiFetch<JudgeSessionPayload>(`/runtime/judge/session/${sessionId}`, {
      publicRoute: true,
      headers,
    });
  } catch {
    return null;
  }
}

export async function saveJudgeSession(
  tcg: TcgType,
  items: JudgeHistoryItem[],
  userId: string,
  allowAnonymousRead = false,
): Promise<string | null> {
  try {
    const data = await apiFetch<JudgeSessionPayload>("/runtime/judge/session", {
      method: "POST",
      publicRoute: true,
      headers: { "X-Judge-User-Id": userId },
      body: {
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
      },
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
