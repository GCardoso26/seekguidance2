const STORAGE_KEY = "judge-daily-usage-v1";

type DailyUsage = {
  date: string;
  count: number;
};

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function read(): DailyUsage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: todayKey(), count: 0 };
    const parsed = JSON.parse(raw) as DailyUsage;
    if (parsed.date !== todayKey()) return { date: todayKey(), count: 0 };
    return parsed;
  } catch {
    return { date: todayKey(), count: 0 };
  }
}

function write(data: DailyUsage): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getDailyQuestionCount(): number {
  return read().count;
}

export function incrementDailyQuestionCount(): number {
  const current = read();
  const next = { date: todayKey(), count: current.count + 1 };
  write(next);
  return next.count;
}
