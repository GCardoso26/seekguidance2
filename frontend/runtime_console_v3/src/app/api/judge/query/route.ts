import { NextRequest, NextResponse } from "next/server";
import { API_BASE } from "@/lib/stripe/stripe-api-headers";
import {
  applyDailyCookie,
  checkAndReserveQuestion,
} from "@/lib/api/plan-enforcement";
import { getAuthenticatedUserId } from "@/lib/api/supabase-user";

function parseTcg(body: string): string | null {
  try {
    const parsed = JSON.parse(body) as { tcg?: string };
    return typeof parsed.tcg === "string" ? parsed.tcg : null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const tcg = parseTcg(body);
  if (!tcg) {
    return NextResponse.json({ detail: "Campo tcg é obrigatório." }, { status: 400 });
  }

  const userId = await getAuthenticatedUserId();
  const check = await checkAndReserveQuestion(req, tcg, userId);
  if (!check.ok) return check.response;

  const upstream = await fetch(`${API_BASE}/runtime/judge/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    cache: "no-store",
  });
  const text = await upstream.text();
  const res = new NextResponse(text, {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
  if (check.setCookie && upstream.ok) applyDailyCookie(res, check.setCookie);
  return res;
}
