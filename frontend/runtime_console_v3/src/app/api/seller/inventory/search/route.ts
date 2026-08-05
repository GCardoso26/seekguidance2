import { NextRequest, NextResponse } from "next/server";
import { fetchApiResilient, tournamentProxyHeaders } from "@/lib/tournament-api";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    const headers = await tournamentProxyHeaders(req);
    if (!headers.Authorization || !headers["X-Judge-User-Id"]) {
      return NextResponse.json({ detail: "Autenticação necessária" }, { status: 401 });
    }
    const qs = req.nextUrl.searchParams.toString();
    const res = await fetchApiResilient(
      `/runtime/judge/seller/inventory/search${qs ? `?${qs}` : ""}`,
      { headers, cache: "no-store" },
    );
    const text = await res.text();
    return new NextResponse(text || JSON.stringify({ items: [], total: 0 }), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
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
