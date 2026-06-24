import { NextResponse } from "next/server";
import { API_PROXY_BASE, API_FETCH_TIMEOUT_MS } from "@/lib/api-proxy-base";

export const revalidate = 60;

export async function GET() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_FETCH_TIMEOUT_MS);

    const res = await fetch(`${API_PROXY_BASE}/runtime/judge/catalog/health`, {
      signal: controller.signal,
      next: { revalidate: 60 },
    });
    clearTimeout(timeoutId);

    const data = (await res.json()) as Record<string, unknown>;
    const ready = Boolean(data.ready_for_marketplace);
    return NextResponse.json(
      {
        ...data,
        status: ready ? "ready_for_marketplace" : "loading",
      },
      { status: res.ok ? 200 : res.status },
    );
  } catch {
    return NextResponse.json({ error: "catalog_health_unavailable" }, { status: 503 });
  }
}
