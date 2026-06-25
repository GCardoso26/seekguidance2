import { NextRequest, NextResponse } from "next/server";
import { fetchApiResilient, tournamentProxyHeaders } from "@/lib/tournament-api";

export const maxDuration = 60;

function apiUnavailable() {
  return NextResponse.json(
    {
      detail:
        "API indisponível — o servidor Render pode estar acordando. Aguarde 1 minuto e tente novamente.",
    },
    { status: 503 },
  );
}

export async function GET(req: NextRequest) {
  const qs = req.nextUrl.search;
  try {
    const res = await fetchApiResilient(`/runtime/judge/stores${qs}`);
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return apiUnavailable();
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const res = await fetchApiResilient(`/runtime/judge/stores`, {
      method: "POST",
      headers: await tournamentProxyHeaders(),
      body,
      cache: "no-store",
    });
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return apiUnavailable();
  }
}
