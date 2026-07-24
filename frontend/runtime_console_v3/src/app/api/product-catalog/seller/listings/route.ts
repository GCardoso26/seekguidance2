import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headers = await tournamentProxyHeaders(req);
  if (!headers.Authorization || !headers["X-Judge-User-Id"]) {
    return NextResponse.json({ detail: "Autenticação necessária" }, { status: 401 });
  }
  const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/product-catalog/seller/listings`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body,
  });
  const text = await res.text();
  return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
}
