import { NextRequest, NextResponse } from "next/server";
import { API_BASE } from "@/lib/stripe/stripe-api-headers";
import {
  applyDailyCookie,
  checkAndReserveQuestion,
} from "@/lib/api/plan-enforcement";
import { resolveRulesAccess, rulesAccessDeniedResponse } from "@/lib/api/rules-access-server";
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
  const rules = await resolveRulesAccess(userId);
  if (!rules.allowed) {
    return rulesAccessDeniedResponse(rules.reason ?? "upgrade_required");
  }

  const check = await checkAndReserveQuestion(req, tcg, userId);
  if (!check.ok) return check.response;

  const upstream = await fetch(`${API_BASE}/runtime/judge/query/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    cache: "no-store",
  });

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "");
    return new NextResponse(text || JSON.stringify({ detail: "Stream indisponível" }), {
      status: upstream.status || 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  const res = new NextResponse(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
  if (check.setCookie) applyDailyCookie(res, check.setCookie);
  return res;
}
