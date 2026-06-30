import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mockAllNotifications } from "@/lib/notifications-mock";
import { parseNotificationsPayload } from "@/lib/notifications";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  let items = user ? mockAllNotifications(user.id) : [];

  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/notifications/feed`, {
      headers: await tournamentProxyHeaders(),
      cache: "no-store",
    });
    if (res.ok) {
      const text = await res.text();
      const remote = parseNotificationsPayload(JSON.parse(text));
      const ids = new Set(items.map((n) => n.id));
      items = [...items, ...remote.filter((n) => !ids.has(n.id))];
    }
  } catch {
    // mock only
  }

  return NextResponse.json(items, { status: 200 });
}
