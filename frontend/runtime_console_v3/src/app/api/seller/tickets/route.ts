import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";
import { sellerTicketsMock } from "@/lib/seller-tickets-mock";

export async function GET(req: NextRequest) {
  try {
    const qs = req.nextUrl.searchParams.toString();
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/seller/tickets${qs ? `?${qs}` : ""}`,
      { headers: await tournamentProxyHeaders(), cache: "no-store" },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return NextResponse.json(await res.json());
  } catch {
    const status = req.nextUrl.searchParams.get("status") ?? undefined;
    return NextResponse.json(sellerTicketsMock(status ?? undefined));
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/seller/tickets`, {
      method: "POST",
      headers: { ...(await tournamentProxyHeaders()), "Content-Type": "application/json" },
      body,
    });
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ ticket: { id: "mock-ticket", subject: "Ticket criado" } });
  }
}
