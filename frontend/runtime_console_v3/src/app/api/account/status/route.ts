import { NextResponse } from "next/server";
import { fetchApiResilient } from "@/lib/api-proxy-base";
import { tournamentProxyHeaders } from "@/lib/tournament-api";

export async function GET() {
  try {
    const headers = await tournamentProxyHeaders();
    const res = await fetchApiResilient("/runtime/judge/account/status", {
      headers,
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
    const outHeaders: Record<string, string> = { "Content-Type": "application/json" };
    const retryAfter = res.headers.get("Retry-After");
    if (retryAfter) outHeaders["Retry-After"] = retryAfter;
    return new NextResponse(text, { status: res.status, headers: outHeaders });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
