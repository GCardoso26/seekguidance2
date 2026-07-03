import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";
import { sellerTeamUsersMock } from "@/lib/seller-team-mock";
import { preferSellerCiMocks } from "@/lib/seller-ci-mock";

export async function GET() {
  if (preferSellerCiMocks()) {
    return NextResponse.json(sellerTeamUsersMock());
  }
  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/seller/team/users`, {
      headers: await tournamentProxyHeaders(),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json(sellerTeamUsersMock());
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/seller/team/users`, {
      method: "POST",
      headers: { ...(await tournamentProxyHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return NextResponse.json(await res.json());
  } catch {
    const mock = sellerTeamUsersMock();
    return NextResponse.json({
      user: {
        ...mock.users[1],
        invited_email: body.email ?? "novo@loja.com",
      },
    });
  }
}
