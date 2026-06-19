import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  let proCount = 0;
  let totalPlayers = 0;

  if (url && serviceKey) {
    const supabase = createClient(url, serviceKey, { db: { schema: "tcg_judge" } });

    const { count: pro } = await supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .in("tier", ["spike", "team"])
      .in("status", ["active", "trialing"]);

    const { count: players } = await supabase
      .from("player_profiles")
      .select("id", { count: "exact", head: true });

    proCount = pro ?? 0;
    totalPlayers = players ?? 0;
  }

  return NextResponse.json({
    proCount,
    totalPlayers,
    displayProCount: proCount > 0 ? proCount : null,
  });
}
