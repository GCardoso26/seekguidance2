import type { JudgeHistoryItem, TcgType } from "@/types/judge";

export type PlayerJudgeStats = {
  totalConsultations: number;
  topTcg: TcgType | null;
  topTcgLabel: string | null;
  streakDays: number;
};

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

export function computePlayerJudgeStats(
  items: JudgeHistoryItem[],
  tcgLabels: Record<string, string>,
): PlayerJudgeStats {
  if (items.length === 0) {
    return { totalConsultations: 0, topTcg: null, topTcgLabel: null, streakDays: 0 };
  }

  const counts = new Map<TcgType, number>();
  for (const item of items) {
    counts.set(item.tcg, (counts.get(item.tcg) ?? 0) + 1);
  }

  let topTcg: TcgType | null = null;
  let topCount = 0;
  for (const [tcg, count] of counts) {
    if (count > topCount) {
      topTcg = tcg;
      topCount = count;
    }
  }

  const uniqueDays = new Set(items.map((i) => dayKey(i.createdAt)));
  let streak = 0;
  const cursor = new Date();
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (!uniqueDays.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return {
    totalConsultations: items.length,
    topTcg,
    topTcgLabel: topTcg ? (tcgLabels[topTcg] ?? topTcg) : null,
    streakDays: streak,
  };
}
