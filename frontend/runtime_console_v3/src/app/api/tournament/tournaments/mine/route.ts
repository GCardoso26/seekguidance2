import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  listTournamentsFromApiRows,
  listTournamentsMock,
  type SellerTournamentsListParams,
} from "@/lib/seller-tournaments-bff";

function parseParams(req: NextRequest): SellerTournamentsListParams {
  const sp = req.nextUrl.searchParams;
  return {
    page: Number(sp.get("page") ?? "1") || 1,
    limit: Number(sp.get("limit") ?? "20") || 20,
    status: sp.get("status") ?? undefined,
    game: sp.get("game") ?? sp.get("game_id") ?? undefined,
    format: sp.get("format") ?? sp.get("pairing_format") ?? undefined,
  };
}

export async function GET(req: NextRequest) {
  const params = parseParams(req);
  const supabaseAuth = await createSupabaseServerClient();
  if (!supabaseAuth) {
    return NextResponse.json(listTournamentsMock(params));
  }

  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();
  if (!user) {
    return NextResponse.json({ detail: "Não autenticado" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json(listTournamentsMock(params));
  }

  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 20));
  const offset = (page - 1) * limit;

  const db = createClient(url, serviceKey, { db: { schema: "tcg_judge" } });
  let query = db
    .from("tournaments")
    .select(
      "id, name, tcg, game_code, format, format_code, status, max_players, starts_at, created_at, match_type",
      { count: "exact" },
    )
    .eq("created_by", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (params.status) query = query.eq("status", params.status);
  if (params.game) query = query.eq("game_code", params.game.toUpperCase());

  const { data, count, error } = await query;
  if (error || !data) {
    return NextResponse.json(listTournamentsMock(params));
  }

  const rows = data.map((row) => ({
    ...row,
    pairing_format: "swiss",
    entry_fee_cents: 0,
  }));

  const listed = listTournamentsFromApiRows(rows as Record<string, unknown>[], {
    ...params,
    page: 1,
    limit: rows.length,
  });

  return NextResponse.json({
    tournaments: listed.tournaments,
    total: count ?? listed.total,
    page,
    limit,
  });
}
