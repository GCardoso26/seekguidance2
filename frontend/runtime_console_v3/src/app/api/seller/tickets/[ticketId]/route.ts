import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";
import { sellerTicketsMock } from "@/lib/seller-tickets-mock";

type Ctx = { params: Promise<{ ticketId: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { ticketId } = await ctx.params;
  try {
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/seller/tickets/${encodeURIComponent(ticketId)}`,
      { headers: await tournamentProxyHeaders(), cache: "no-store" },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return NextResponse.json(await res.json());
  } catch {
    const ticket = sellerTicketsMock().tickets[0];
    return NextResponse.json({
      ticket: { ...ticket, id: ticketId },
      messages: [{ id: "m1", content: "Não recebi meu pedido", author_type: "customer", is_internal: false }],
    });
  }
}
