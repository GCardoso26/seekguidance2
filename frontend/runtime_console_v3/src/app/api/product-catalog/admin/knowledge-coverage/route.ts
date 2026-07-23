import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

async function requireAdminHeaders(request?: NextRequest) {
  const headers = await tournamentProxyHeaders(request);
  if (!headers["X-Judge-User-Id"]) {
    return {
      error: NextResponse.json({ detail: "Autenticação necessária" }, { status: 401 }),
    };
  }
  return { headers };
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminHeaders(req);
  if ("error" in auth && auth.error) return auth.error;
  const res = await fetch(
    `${TOURNAMENT_API_BASE}/runtime/judge/product-catalog/admin/knowledge-coverage`,
    { headers: auth.headers, cache: "no-store" },
  );
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminHeaders(req);
  if ("error" in auth && auth.error) return auth.error;
  const res = await fetch(
    `${TOURNAMENT_API_BASE}/runtime/judge/product-catalog/admin/knowledge-coverage/refresh`,
    { method: "POST", headers: auth.headers, cache: "no-store" },
  );
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
