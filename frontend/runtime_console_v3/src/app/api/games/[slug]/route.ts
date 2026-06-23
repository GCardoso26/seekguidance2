import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, catalogProxyHeaders } from "@/lib/tournament-api";

const API_BASE = (process.env.API_PROXY_TARGET || TOURNAMENT_API_BASE).replace(/\/$/, "");

/** Sync MTG completo pode levar vários minutos. */
export const maxDuration = 300;

type RouteParams = { params: Promise<{ slug: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  try {
    const res = await fetch(`${API_BASE}/runtime/judge/catalog/games/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ error: "game_unavailable" }, { status: 503 });
  }
}

async function proxySync(slug: string, full: boolean, headers: Record<string, string>) {
  const catalogUrl = `${API_BASE}/runtime/judge/catalog/games/${encodeURIComponent(slug)}/sync?full=${full}`;
  let res = await fetch(catalogUrl, { method: "POST", headers, cache: "no-store" });
  if (res.status === 404) {
    const legacyUrl = `${API_BASE}/runtime/judge/games/${encodeURIComponent(slug)}/sync?full=${full}`;
    res = await fetch(legacyUrl, { method: "POST", headers, cache: "no-store" });
  }
  return res;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  const full = request.nextUrl.searchParams.get("full") === "true";

  const headers = await catalogProxyHeaders(request);
  if (!headers.Authorization) {
    return NextResponse.json(
      {
        error: "session_expired",
        detail: "Sessão expirada. Faça login novamente em /login?next=/admin/catalog",
      },
      { status: 401 },
    );
  }

  try {
    const res = await proxySync(slug, full, headers);
    const text = await res.text();
    let body: unknown = { error: "sync_failed" };
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = { detail: text };
      }
    }
    return NextResponse.json(body, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "sync_failed", detail: "API indisponível. Tente novamente em alguns minutos." },
      { status: 503 },
    );
  }
}
