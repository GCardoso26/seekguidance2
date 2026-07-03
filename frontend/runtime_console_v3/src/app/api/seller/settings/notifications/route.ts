import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";
import { sellerNotificationSettingsMock } from "@/lib/seller-finance-mock";

export async function GET() {
  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/seller/settings/notifications`, {
      headers: await tournamentProxyHeaders(),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json(sellerNotificationSettingsMock());
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/seller/settings/notifications`, {
      method: "PUT",
      headers: { ...(await tournamentProxyHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return NextResponse.json(await res.json());
  } catch {
    const body = await req.json().catch(() => sellerNotificationSettingsMock());
    return NextResponse.json({ settings: body.settings ?? body });
  }
}
