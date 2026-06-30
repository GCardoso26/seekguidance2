import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mockPriceAlertNotifications } from "@/lib/wishlist-price-alerts-mock";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

export async function GET() {
  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/notifications/unread-count`, {
      headers: await tournamentProxyHeaders(),
      cache: "no-store",
    });
    const text = await res.text();
    let count = 0;
    try {
      const parsed = JSON.parse(text) as { count?: number };
      count = parsed.count ?? 0;
    } catch {
      count = 0;
    }

    const supabase = await createSupabaseServerClient();
    const user = supabase ? (await supabase.auth.getUser()).data.user : null;
    if (user) {
      const unreadPrice = mockPriceAlertNotifications(user.id).filter((n) => !n.readAt).length;
      count += unreadPrice;
    }

    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 }, { status: 200 });
  }
}
