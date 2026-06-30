import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  fetchAdminParticipants,
  fetchPublicParticipants,
  getTcgJudgeDb,
  isTournamentOrganizer,
  publicParticipantsMock,
} from "@/lib/tournament-registration-bff";
import { TOURNAMENT_API_BASE } from "@/lib/tournament-api";

type Params = { params: Promise<{ id: string }> };

async function fetchTournamentMeta(id: string) {
  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/tournaments/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const admin = req.nextUrl.searchParams.get("admin") === "1";
  const db = getTcgJudgeDb();

  if (admin) {
    const supabaseAuth = await createSupabaseServerClient();
    if (!supabaseAuth) {
      return NextResponse.json({ detail: "Autenticação indisponível" }, { status: 503 });
    }
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ detail: "Não autenticado" }, { status: 401 });
    }
    if (!db) {
      return NextResponse.json({ participants: [], total: 0 });
    }
    const organizer = await isTournamentOrganizer(db, id, user.id);
    if (!organizer) {
      return NextResponse.json({ detail: "Apenas o organizador" }, { status: 403 });
    }
    const data = await fetchAdminParticipants(db, id);
    return NextResponse.json(data);
  }

  const meta = await fetchTournamentMeta(id);
  const maxPlayers = meta?.max_players != null ? Number(meta.max_players) : null;

  if (!db) {
    return NextResponse.json(publicParticipantsMock());
  }

  try {
    const data = await fetchPublicParticipants(db, id, maxPlayers);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(publicParticipantsMock());
  }
}
