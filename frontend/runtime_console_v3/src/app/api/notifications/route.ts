import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  countUnread,
  filterNotifications,
  paginateNotifications,
  parseNotificationsPayload,
} from "@/lib/notifications";
import { mockAllNotifications } from "@/lib/notifications-mock";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";
import type { AppNotification } from "@/types/post";

async function resolveUser() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function GET(req: NextRequest) {
  const user = await resolveUser();
  if (!user) return NextResponse.json({ detail: "Não autenticado" }, { status: 401 });

  const page = Number(req.nextUrl.searchParams.get("page") ?? "1");
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? "20");
  const filter = req.nextUrl.searchParams.get("filter") ?? "all";

  let items: AppNotification[] = [];
  try {
    const qs = new URLSearchParams({ page: String(page), limit: String(limit), filter });
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/notifications?${qs}`, {
      headers: await tournamentProxyHeaders(req),
      cache: "no-store",
    });
    if (res.ok) {
      const text = await res.text();
      items = parseNotificationsPayload(JSON.parse(text));
    }
  } catch {
    // stub
  }

  const mockItems = mockAllNotifications(user.id);
  const merged = [...mockItems, ...items.filter((i) => !mockItems.some((m) => m.id === i.id))];
  const filtered = filterNotifications(merged, filter);
  const { items: pageItems, total } = paginateNotifications(filtered, page, limit);

  return NextResponse.json({
    items: pageItems,
    total,
    unread: countUnread(merged),
    page: Math.max(1, page),
    limit: Math.min(100, Math.max(1, limit)),
  });
}
