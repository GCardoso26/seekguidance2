import { NextResponse } from "next/server";

const API_BASE = (process.env.API_PROXY_TARGET || "http://127.0.0.1:8000").replace(/\/$/, "");

export async function GET() {
  try {
    const res = await fetch(`${API_BASE}/runtime/judge/catalog/health`, {
      cache: "no-store",
      next: { revalidate: 0 },
    });
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
