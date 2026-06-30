import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mockPriceAlertNotifications } from "@/lib/wishlist-price-alerts-mock";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";
import type { AppNotification } from "@/types/post";

export async function GET() {
  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/notifications/feed`, {
      headers: await tournamentProxyHeaders(),
      cache: "no-store",
    });
    const text = await res.text();
    let items: AppNotification[] = [];
    try {
      const parsed = JSON.parse(text) as AppNotification[] | { items?: AppNotification[] };
      items = Array.isArray(parsed) ? parsed : (parsed.items ?? []);
    } catch {
      items = [];
    }

    const supabase = await createSupabaseServerClient();
    const user = supabase ? (await supabase.auth.getUser()).data.user : null;
    const priceAlerts = user ? mockPriceAlertNotifications(user.id) : [];
    const merged = [...priceAlerts, ...items];

    return NextResponse.json(merged, { status: 200 });
  } catch {
    const supabase = await createSupabaseServerClient();
    const user = supabase ? (await supabase.auth.getUser()).data.user : null;
    const priceAlerts = user ? mockPriceAlertNotifications(user.id) : [];
    return NextResponse.json(priceAlerts, { status: 200 });
  }
}
