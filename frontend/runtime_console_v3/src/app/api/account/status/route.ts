import { NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

export async function GET() {
  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/account/status`, {
      headers: await tournamentProxyHeaders(),
      cache: "no-store",
    });
    const text = await res.text();
    if (res.ok) {
      try {
        const data = JSON.parse(text) as { player?: unknown };
        if (!data?.player) {
          return NextResponse.json({ detail: "Resposta inválida da API" }, { status: 502 });
        }
      } catch {
        return NextResponse.json({ detail: "Resposta inválida da API" }, { status: 502 });
      }
    }
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
