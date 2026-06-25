import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE } from "@/lib/tournament-api";
import { authorizeCron } from "@/lib/cron/auth";

export async function GET(req: NextRequest) {
  const denied = authorizeCron(req);
  if (denied) return denied;

  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/alerts/price/cron/check`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "API indisponível" }, { status: 503 });
  }
}
