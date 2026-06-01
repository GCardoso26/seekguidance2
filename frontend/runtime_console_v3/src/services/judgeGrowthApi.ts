import { apiFetch } from "@/services/api/client";

export type GrowthEventType =
  | "login"
  | "share_created"
  | "share_opened"
  | "session_restored"
  | "related_question_clicked"
  | "history_opened"
  | "judge_question_sent";

export async function recordGrowthEvent(payload: {
  metric_type: GrowthEventType;
  game?: string;
  metric_value?: number;
  details?: Record<string, unknown>;
}): Promise<void> {
  try {
    await apiFetch("/runtime/judge/growth/event", {
      method: "POST",
      publicRoute: true,
      body: payload,
    });
  } catch {
    /* best-effort */
  }
}

export type JudgeGrowthDashboard = {
  window_days: number;
  dau: number;
  wau: number;
  mau: number;
  sessions_per_user: number;
  questions_per_session: number;
  related_question_ctr: number;
  shares_created: number;
  shares_opened: number;
  top_games: Array<{ game: string; events: number }>;
  events_by_type: Record<string, number>;
};

export async function getJudgeGrowth(days = 30): Promise<JudgeGrowthDashboard> {
  return apiFetch<JudgeGrowthDashboard>(`/runtime/judge/growth?days=${days}`, {
    publicRoute: true,
  });
}
