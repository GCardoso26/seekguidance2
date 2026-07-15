import { NextRequest, NextResponse } from "next/server";
import { fetchApiResilient } from "@/lib/api-proxy-base";
import { tournamentProxyHeaders } from "@/lib/tournament-api";

export async function GET(req: NextRequest) {
  const storeId = req.nextUrl.searchParams.get("store_id");
  const qs = storeId ? `?store_id=${encodeURIComponent(storeId)}` : "";
  try {
    const headers = await tournamentProxyHeaders(req);
    const res = await fetchApiResilient(`/runtime/events${qs}`, {
      headers,
      cache: "no-store",
    });
    return new NextResponse(await res.text(), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json({ detail: "API indisponível", events: [] }, { status: 503 });
  }
}
