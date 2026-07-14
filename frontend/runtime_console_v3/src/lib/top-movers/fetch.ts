import type { TopMoversQuery, TopMoversResponse } from "@/lib/top-movers/types";

const API_BASE = (
  process.env.API_PROXY_TARGET ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://seekguidance.onrender.com"
).replace(/\/$/, "");

export async function fetchTopMovers(query: TopMoversQuery = {}): Promise<TopMoversResponse> {
  const params = new URLSearchParams();
  if (query.game) params.set("game", query.game);
  if (query.period) params.set("period", query.period);
  if (query.sort) params.set("sort", query.sort);
  if (query.foil) params.set("foil", query.foil);
  if (query.limit) params.set("limit", query.limit);

  const qs = params.toString();
  const url = `${API_BASE}/runtime/top-movers${qs ? `?${qs}` : ""}`;

  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) {
      return { source: "data_marts", insights: [], top_gainers: [], top_losers: [], filtered: [] };
    }
    return (await res.json()) as TopMoversResponse;
  } catch {
    return { source: "data_marts", insights: [], top_gainers: [], top_losers: [], filtered: [] };
  }
}
