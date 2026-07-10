import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

async function proxy(req: NextRequest, path: string, init?: RequestInit) {
  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}${path}`, {
      ...init,
      headers: await tournamentProxyHeaders(req),
      cache: "no-store",
    });
    if (res.status === 404 || res.status === 501) return null;
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const proxied = await proxy(req, "/runtime/judge/buyer/wishlists");
  if (proxied) return proxied;
  return NextResponse.json({ lists: [] });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const proxied = await proxy(req, "/runtime/judge/buyer/wishlists", {
    method: "POST",
    body,
    headers: { "Content-Type": "application/json" },
  });
  if (proxied) return proxied;
  return NextResponse.json({ detail: "Backend indisponível" }, { status: 503 });
}
