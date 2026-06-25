import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authorizeCron } from "@/lib/cron/auth";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { db: { schema: "tcg_judge" } });
}

interface AlertRow {
  id: string;
  user_id: string;
  card_id: string;
  target_price_cents: number;
  price_condition: string;
  target_percentage: number | null;
  cooldown_hours: number;
  last_notified_at: string | null;
  trigger_count: number;
}

function shouldTrigger(alert: AlertRow, currentPriceCents: number): boolean {
  switch (alert.price_condition) {
    case "below":
      return currentPriceCents <= alert.target_price_cents;
    case "above":
      return currentPriceCents >= alert.target_price_cents;
    case "change_up":
    case "change_down":
      return false;
    default:
      return false;
  }
}

function cooldownExpired(alert: AlertRow, now: Date): boolean {
  if (!alert.last_notified_at) return true;
  const last = Date.parse(alert.last_notified_at);
  const hours = alert.cooldown_hours ?? 24;
  return now.getTime() - last >= hours * 60 * 60 * 1000;
}

export async function GET(req: NextRequest) {
  const denied = authorizeCron(req);
  if (denied) return denied;

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase não configurado" }, { status: 503 });
  }

  const now = new Date();
  const { data: alerts, error } = await supabase
    .from("price_alerts")
    .select(
      "id, user_id, card_id, target_price_cents, price_condition, target_percentage, cooldown_hours, last_notified_at, trigger_count",
    )
    .eq("status", "active");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let triggered = 0;

  for (const alert of (alerts ?? []) as AlertRow[]) {
    if (!cooldownExpired(alert, now)) continue;

    const { data: listings } = await supabase
      .from("card_listings")
      .select("price_cents")
      .eq("card_id", alert.card_id)
      .eq("status", "active")
      .order("price_cents", { ascending: true })
      .limit(1);

    const currentPrice = listings?.[0]?.price_cents;
    if (!currentPrice || !shouldTrigger(alert, currentPrice)) {
      await supabase
        .from("price_alerts")
        .update({ last_checked_at: now.toISOString() })
        .eq("id", alert.id);
      continue;
    }

    const { data: card } = await supabase
      .from("card_catalog")
      .select("name, image_url")
      .eq("id", alert.card_id)
      .maybeSingle();

    await supabase.from("alert_notifications").insert({
      alert_id: alert.id,
      notification_type: "email",
      success: true,
      triggered_price_cents: currentPrice,
      card_name: card?.name ?? "Carta",
      card_image_url: card?.image_url,
    });

    await supabase
      .from("price_alerts")
      .update({
        status: "triggered",
        triggered_at: now.toISOString(),
        last_notified_at: now.toISOString(),
        last_checked_at: now.toISOString(),
        trigger_count: (alert.trigger_count ?? 0) + 1,
        email_notified: true,
      })
      .eq("id", alert.id);

    triggered += 1;
  }

  return NextResponse.json({ ok: true, checked: alerts?.length ?? 0, triggered });
}
