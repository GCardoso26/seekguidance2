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

  const body = await req.json();
  const origin = req.headers.get("origin") ?? "http://localhost:3000";
  const payload = {
    ...body,
    email: user.email,
    name: user.user_metadata?.full_name ?? user.email,
    success_url:
      body.success_url ??
      `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: body.cancel_url ?? `${origin}/pricing`,
  };

  try {
    const res = await fetch(`${API_BASE}/runtime/judge/stripe/checkout`, {
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
