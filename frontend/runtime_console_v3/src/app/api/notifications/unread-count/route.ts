import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mockUnreadCount } from "@/lib/notifications-mock";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!user) return NextResponse.json({ count: 0 });

  let count = mockUnreadCount(user.id);

  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/notifications/unread-count`, {
      headers: await tournamentProxyHeaders(),
      cache: "no-store",
    });
    if (res.ok) {
      const parsed = (await res.json()) as { count?: number };
      count += parsed.count ?? 0;
    }
  } catch {
    // mock only
  }

  return NextResponse.json({ count });
}
