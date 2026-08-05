import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

/** Importações grandes (Liga) precisam de mais tempo que o default do gateway. */
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const headers = await tournamentProxyHeaders(req);
    if (!headers.Authorization || !headers["X-Judge-User-Id"]) {
      return NextResponse.json({ detail: "Autenticação necessária" }, { status: 401 });
    }
    const body = await req.text();
    if (!body || body.length < 2) {
      return NextResponse.json({ detail: "Body CSV ausente" }, { status: 400 });
    }
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/seller/inventory/import-csv`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body,
    });
    const text = await res.text();
    return new NextResponse(text || JSON.stringify({ detail: "Resposta vazia da API" }), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "API indisponível";
    return NextResponse.json(
      {
        detail:
          message.includes("abort") || message.includes("Timeout")
            ? "Timeout na importação — tente um arquivo menor ou aguarde o servidor acordar e tente de novo."
            : "API indisponível — o servidor pode estar acordando. Aguarde 1 minuto e tente novamente.",
      },
      { status: 503 },
    );
  }
}
