import type { JudgeHistoryItem } from "@/types/judge";

export type HistoryGroupLabel = "Hoje" | "Ontem" | "Últimos 7 dias" | "Mais antigo";

export type GroupedHistory = {
  label: HistoryGroupLabel;
  items: JudgeHistoryItem[];
};

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function groupJudgeHistory(items: JudgeHistoryItem[]): GroupedHistory[] {
  const now = new Date();
  const today = startOfDay(now).getTime();
  const yesterday = today - 86_400_000;
  const weekAgo = today - 7 * 86_400_000;

  const buckets: Record<HistoryGroupLabel, JudgeHistoryItem[]> = {
    Hoje: [],
    Ontem: [],
    "Últimos 7 dias": [],
    "Mais antigo": [],
  };

  for (const item of items) {
    const t = new Date(item.createdAt).getTime();
    if (t >= today) buckets.Hoje.push(item);
    else if (t >= yesterday) buckets.Ontem.push(item);
    else if (t >= weekAgo) buckets["Últimos 7 dias"].push(item);
    else buckets["Mais antigo"].push(item);
  }

  return (Object.keys(buckets) as HistoryGroupLabel[])
    .map((label) => ({ label, items: buckets[label] }))
    .filter((g) => g.items.length > 0);
}

export function filterJudgeHistory(items: JudgeHistoryItem[], query: string): JudgeHistoryItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (item) =>
      item.question.toLowerCase().includes(q) ||
      item.answer.toLowerCase().includes(q) ||
      (item.rule_applied?.toLowerCase().includes(q) ?? false),
  );
}
