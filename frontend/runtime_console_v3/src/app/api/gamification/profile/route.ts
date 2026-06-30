import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";
import { mockGamificationProfile } from "@/lib/gamification-mock";

async function resolveUser() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  const user = await resolveUser();
  if (!user) return NextResponse.json({ detail: "Não autenticado" }, { status: 401 });

  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/gamification/profile`, {
      headers: await tournamentProxyHeaders(),
      cache: "no-store",
    });
    if (res.ok) {
      const text = await res.text();
      return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
    }
  } catch {
    // stub
  }

  const profile = mockGamificationProfile(
    user.id,
    user.user_metadata?.full_name ?? user.email?.split("@")[0],
  );
  return NextResponse.json(profile);
}
