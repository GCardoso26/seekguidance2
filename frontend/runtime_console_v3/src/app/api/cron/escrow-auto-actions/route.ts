import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authorizeCron } from "@/lib/cron/auth";
import { planEscrowAutoActions } from "@/lib/escrow/escrow-service";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { db: { schema: "tcg_judge" } });
}

export async function GET(req: NextRequest) {
  const denied = authorizeCron(req);
  if (denied) return denied;

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase não configurado" }, { status: 503 });
  }

  const { data: rows, error } = await supabase
    .from("escrow_transactions")
    .select("id, status, payment_deadline, shipping_deadline, confirmation_deadline, auto_release_at")
    .in("status", ["pending_payment", "payment_received", "shipped", "delivered"]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const plan = planEscrowAutoActions(rows ?? []);
  const now = new Date().toISOString();

  if (plan.cancelIds.length) {
    await supabase
      .from("escrow_transactions")
      .update({ status: "cancelled", updated_at: now })
      .in("id", plan.cancelIds);
  }

  if (plan.releaseIds.length) {
    await supabase
      .from("escrow_transactions")
      .update({ status: "released_to_seller", updated_at: now })
      .in("id", plan.releaseIds);
  }

  return NextResponse.json({
    ok: true,
    cancelled: plan.cancelIds.length,
    autoReleased: plan.releaseIds.length,
    shippingReminders: plan.shippingReminderIds.length,
    confirmationReminders: plan.confirmationReminderIds.length,
    reminderIds: {
      shipping: plan.shippingReminderIds,
      confirmation: plan.confirmationReminderIds,
    },
  });
}
