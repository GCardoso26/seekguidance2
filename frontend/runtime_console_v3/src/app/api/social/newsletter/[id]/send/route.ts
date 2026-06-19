import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    if (url && serviceKey) {
      const supabase = createClient(url, serviceKey);
      const { error: fnErr } = await supabase.functions.invoke("send-newsletter", {
        body: { newsletterId: id },
      });
      if (fnErr) {
        const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/social/newsletter/${id}/send`, {
          method: "POST",
          headers: await tournamentProxyHeaders(),
          cache: "no-store",
        });
        return new NextResponse(await res.text(), { status: res.status, headers: { "Content-Type": "application/json" } });
      }
      return NextResponse.json({ ok: true, via: "edge-function" });
    }

    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/social/newsletter/${id}/send`, {
      method: "POST",
      headers: await tournamentProxyHeaders(),
      cache: "no-store",
    });
    return new NextResponse(await res.text(), { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "Falha ao enviar newsletter" }, { status: 503 });
  }
}
