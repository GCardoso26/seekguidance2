import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthenticatedUserId } from "@/lib/api/supabase-user";

const TCG_MAP: Record<string, string> = {
  magic: "magic",
  pokemon: "pokemon",
  yugioh: "yugioh",
  lorcana: "lorcana",
  one_piece: "one_piece",
  digimon: "digimon",
  flesh_and_blood: "flesh_and_blood",
  star_wars_unlimited: "star_wars",
};

export async function GET(req: NextRequest) {
  const game = req.nextUrl.searchParams.get("game") ?? "magic";
  const metric = req.nextUrl.searchParams.get("metric") ?? "consultations";
  const scope = req.nextUrl.searchParams.get("scope") ?? "global";
  const stateFilter = req.nextUrl.searchParams.get("state");
  const userId = await getAuthenticatedUserId();
  const tcg = TCG_MAP[game] ?? game;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ entries: [], myRank: null, total: 0 });
  }

  const supabase = createClient(url, serviceKey, { db: { schema: "tcg_judge" } });

  if (metric === "consultations") {
    const { data: sessions } = await supabase.from("judge_sessions").select("id, auth_user_id").eq("tcg", tcg);
    if (!sessions?.length) {
      return NextResponse.json({ entries: [], myRank: null, total: 0 });
    }

    const counts = new Map<string, number>();
    for (const session of sessions) {
      const { count } = await supabase
        .from("judge_session_messages")
        .select("id", { count: "exact", head: true })
        .eq("session_id", session.id)
        .eq("role", "user");
      counts.set(session.auth_user_id, (counts.get(session.auth_user_id) ?? 0) + (count ?? 0));
    }

    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 50);
    const playerIds = sorted.map(([id]) => id);
    const { data: profiles } = await supabase
      .from("player_profiles")
      .select("id, handle, display_name, avatar_url, state, privacy_level")
      .in("id", playerIds);

    let rows =
      profiles?.filter((p) => p.privacy_level === "public").map((p) => ({
        player_id: p.id,
        handle: p.handle,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
        score: counts.get(p.id) ?? 0,
      })) ?? [];

    if (scope === "state" && stateFilter) {
      rows = rows.filter((r) => {
        const profile = profiles?.find((p) => p.id === r.player_id);
        return profile?.state === stateFilter;
      });
    }

    if (scope === "friends" && userId) {
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", userId);
      const friendIds = new Set((follows ?? []).map((f) => f.following_id));
      friendIds.add(userId);
      rows = rows.filter((r) => friendIds.has(r.player_id));
    }

    rows.sort((a, b) => b.score - a.score);
    const top10 = rows.slice(0, 10).map((r, i) => ({ ...r, rank: i + 1 }));
    const myRank = userId ? rows.findIndex((r) => r.player_id === userId) + 1 : null;

    return NextResponse.json({
      entries: top10,
      myRank: myRank && myRank > 0 ? myRank : null,
      total: rows.length,
    });
  }

  if (metric === "streak") {
    const { data: sessions } = await supabase.from("judge_sessions").select("id, auth_user_id").eq("tcg", tcg);
    const streaks = new Map<string, number>();

    for (const uid of new Set((sessions ?? []).map((s) => s.auth_user_id))) {
      const userSessions = (sessions ?? []).filter((s) => s.auth_user_id === uid).map((s) => s.id);
      if (!userSessions.length) continue;
      const { data: messages } = await supabase
        .from("judge_session_messages")
        .select("created_at")
        .eq("role", "user")
        .in("session_id", userSessions)
        .order("created_at", { ascending: false })
        .limit(200);
      const days = new Set((messages ?? []).map((m) => String(m.created_at).slice(0, 10)));
      let streak = 0;
      const cursor = new Date();
      for (;;) {
        const key = cursor.toISOString().slice(0, 10);
        if (!days.has(key)) break;
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
      }
      if (streak > 0) streaks.set(uid, streak);
    }

    const sorted = [...streaks.entries()].sort((a, b) => b[1] - a[1]).slice(0, 50);
    const playerIds = sorted.map(([id]) => id);
    const { data: profiles } = await supabase
      .from("player_profiles")
      .select("id, handle, display_name, avatar_url, state, privacy_level")
      .in("id", playerIds);

    let rows =
      profiles?.filter((p) => p.privacy_level === "public").map((p) => ({
        player_id: p.id,
        handle: p.handle,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
        score: streaks.get(p.id) ?? 0,
      })) ?? [];

    if (scope === "friends" && userId) {
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", userId);
      const friendIds = new Set((follows ?? []).map((f) => f.following_id));
      friendIds.add(userId);
      rows = rows.filter((r) => friendIds.has(r.player_id));
    }

    rows.sort((a, b) => b.score - a.score);
    const top10 = rows.slice(0, 10).map((r, i) => ({ ...r, rank: i + 1 }));
    const myRank = userId ? rows.findIndex((r) => r.player_id === userId) + 1 : null;

    return NextResponse.json({
      entries: top10,
      myRank: myRank && myRank > 0 ? myRank : null,
      total: rows.length,
    });
  }

  return NextResponse.json({ entries: [], myRank: null, total: 0 });
}
