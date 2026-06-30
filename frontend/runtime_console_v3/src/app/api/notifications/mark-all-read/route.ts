import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mockMarkAllNotificationsRead } from "@/lib/notifications-mock";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ detail: "Autenticação indisponível" }, { status: 503 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ detail: "Não autenticado" }, { status: 401 });

  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/notifications/mark-all-read`, {
      method: "POST",
      headers: await tournamentProxyHeaders(),
      cache: "no-store",
    });
    if (res.ok) {
      mockMarkAllNotificationsRead(user.id);
      return new NextResponse(await res.text(), {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch {
    // stub
  }

  const marked = mockMarkAllNotificationsRead(user.id);
  return NextResponse.json({ ok: true, marked });
}
