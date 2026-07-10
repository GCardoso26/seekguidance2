import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

export async function GET(req: NextRequest) {
  const cep = req.nextUrl.searchParams.get("destination_postal_code") ?? "";
  if (!cep) {
    return NextResponse.json({ detail: "destination_postal_code obrigatório" }, { status: 400 });
  }
  try {
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/buyer/shipping/quote?destination_postal_code=${encodeURIComponent(cep)}`,
      {
        headers: await tournamentProxyHeaders(req),
        cache: "no-store",
      },
    );
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json({ detail: "Backend indisponível" }, { status: 503 });
  }
}
