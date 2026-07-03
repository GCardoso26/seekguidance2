import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";
import { sellerCustomerGamificationMock, sellerCustomersMock } from "@/lib/seller-customers-mock";

type Ctx = { params: Promise<{ customerId: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { customerId } = await ctx.params;
  try {
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/seller/customers/${encodeURIComponent(customerId)}`,
      { headers: await tournamentProxyHeaders(), cache: "no-store" },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return NextResponse.json(await res.json());
  } catch {
    const mock = sellerCustomersMock().customers.find((c) => c.customer_id === customerId);
    return NextResponse.json({ customer: mock ?? sellerCustomersMock().customers[0] });
  }
}
