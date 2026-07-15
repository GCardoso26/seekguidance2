import { NextRequest, NextResponse } from "next/server";
import { fetchApiResilient } from "@/lib/api-proxy-base";
import { tournamentProxyHeaders } from "@/lib/tournament-api";

async function proxyGet(req: NextRequest, path: string) {
  const headers = await tournamentProxyHeaders(req);
  const search = req.nextUrl.search;
  const res = await fetchApiResilient(`${path}${search}`, { headers, cache: "no-store" });
  return new NextResponse(await res.text(), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(req: NextRequest) {
  try {
    return await proxyGet(req, "/runtime/event-dashboard");
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
