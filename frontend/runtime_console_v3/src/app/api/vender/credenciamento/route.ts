import { NextRequest, NextResponse } from "next/server";
import { fetchApiResilient, tournamentProxyHeaders } from "@/lib/tournament-api";

export const maxDuration = 60;

function unavailable() {
  return NextResponse.json(
    { detail: "API indisponível — tente novamente em instantes." },
    { status: 503 },
  );
}

export async function GET(req: NextRequest) {
  try {
    const res = await fetchApiResilient(`/runtime/judge/stores/accreditation/mine`, {
      headers: await tournamentProxyHeaders(req),
      cache: "no-store",
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return unavailable();
  }
}

export async function POST(req: NextRequest) {
  try {
    const res = await fetchApiResilient(`/runtime/judge/stores/accreditation`, {
      method: "POST",
      headers: await tournamentProxyHeaders(req),
      cache: "no-store",
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return unavailable();
  }
}
