export type SearchAnalyticsEvent =
  | { type: "search"; query: string; resultCount: number; latencyMs: number; surface: string }
  | { type: "select"; query: string; resultId: string; providerId: string; surface: string }
  | { type: "empty"; query: string; surface: string };

const BUFFER_KEY = "judgetcg-search-analytics-v1";
const MAX_BUFFER = 50;

export function trackSearchEvent(event: SearchAnalyticsEvent) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(BUFFER_KEY);
    const buf: SearchAnalyticsEvent[] = raw ? JSON.parse(raw) : [];
    buf.unshift(event);
    localStorage.setItem(BUFFER_KEY, JSON.stringify(buf.slice(0, MAX_BUFFER)));
  } catch {
    // noop — analytics não deve quebrar UX
  }

  if (process.env.NODE_ENV === "development") {
    console.debug("[search-analytics]", event);
  }
}

export function getSearchAnalyticsBuffer(): SearchAnalyticsEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BUFFER_KEY);
    return raw ? (JSON.parse(raw) as SearchAnalyticsEvent[]) : [];
  } catch {
    return [];
  }
}
