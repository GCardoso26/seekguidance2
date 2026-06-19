import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminEmailServer } from "@/lib/judge-rbac-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function assertAdmin(): Promise<{ ok: false; res: NextResponse } | { ok: true; userId: string }> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, res: NextResponse.json({ detail: "Auth indisponível" }, { status: 503 }) };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmailServer(user.email)) {
    return { ok: false, res: NextResponse.json({ detail: "Acesso negado" }, { status: 403 }) };
  }
  return { ok: true, userId: user.id };
}

export async function GET(req: NextRequest) {
  const auth = await assertAdmin();
  if (!auth.ok) return auth.res;

  const status = req.nextUrl.searchParams.get("status") ?? "pending";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json([]);
  }

  const supabase = createClient(url, serviceKey, { db: { schema: "tcg_judge" } });
  let query = supabase
    .from("post_reports")
    .select(
      "id, post_id, reporter_id, reason, details, status, created_at, community_posts(title, content, author_id)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}

export async function PATCH(req: NextRequest) {
  const auth = await assertAdmin();
  if (!auth.ok) return auth.res;

  const body = (await req.json()) as {
    reportId?: string;
    action?: "approve" | "hide" | "delete" | "ban";
    userId?: string;
  };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ detail: "DB indisponível" }, { status: 503 });
  }

  const supabase = createClient(url, serviceKey, { db: { schema: "tcg_judge" } });

  if (body.action === "ban" && body.userId) {
    await supabase.from("player_profiles").update({ privacy_level: "private" }).eq("id", body.userId);
    if (body.reportId) {
      await supabase
        .from("post_reports")
        .update({
          status: "resolved",
          resolved_at: new Date().toISOString(),
          resolved_by: auth.userId,
        })
        .eq("id", body.reportId);
    }
    return NextResponse.json({ ok: true });
  }

  if (!body.reportId || !body.action) {
    return NextResponse.json({ detail: "Parâmetros inválidos" }, { status: 400 });
  }

  const { data: report } = await supabase
    .from("post_reports")
    .select("post_id")
    .eq("id", body.reportId)
    .maybeSingle();

  if (body.action === "hide" || body.action === "delete") {
    if (report?.post_id) {
      if (body.action === "delete") {
        await supabase.from("community_posts").delete().eq("id", report.post_id);
      } else {
        await supabase.from("community_posts").update({ is_hidden: true }).eq("id", report.post_id);
      }
    }
  }

  await supabase
    .from("post_reports")
    .update({
      status: body.action === "approve" ? "dismissed" : "resolved",
      resolved_at: new Date().toISOString(),
      resolved_by: auth.userId,
    })
    .eq("id", body.reportId);

  return NextResponse.json({ ok: true });
}
