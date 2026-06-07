import { NextRequest, NextResponse } from "next/server";
import { API_BASE, stripeApiHeaders } from "@/lib/stripe/stripe-api-headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ detail: "Auth não configurado" }, { status: 503 });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ detail: "Não autenticado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const origin = req.headers.get("origin") ?? "http://localhost:3000";
  const payload = {
    return_url: body.return_url ?? `${origin}/settings/billing`,
  };

  try {
    const res = await fetch(`${API_BASE}/runtime/judge/stripe/portal`, {
      method: "POST",
      headers: await stripeApiHeaders(user.id),
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
