import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

export async function POST(req: NextRequest) {
  try {
    const headers = await tournamentProxyHeaders(req);
    if (!headers.Authorization) {
      return NextResponse.json(
        { detail: "Sessão expirada ou inválida. Faça login novamente." },
        { status: 401 },
      );
    }

    const body = await req.json();
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/account/cpf`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
