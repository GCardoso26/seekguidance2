import { NextResponse } from "next/server";
import { fetchApiResilient, tournamentProxyHeaders } from "@/lib/tournament-api";

export const maxDuration = 60;

export async function GET() {
  try {
    const res = await fetchApiResilient(`/runtime/judge/stores/mine`, {
      headers: await tournamentProxyHeaders(),
      cache: "no-store",
    });
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json(
      {
        detail:
          "API indisponível — o servidor Render pode estar acordando. Aguarde 1 minuto e tente novamente.",
      },
      { status: 503 },
    );
  }
}
