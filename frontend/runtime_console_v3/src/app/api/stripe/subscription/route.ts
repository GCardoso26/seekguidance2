import { NextResponse } from "next/server";
import { API_BASE, stripeApiHeaders } from "@/lib/stripe/stripe-api-headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEFAULT_FEATURES } from "@/lib/subscription/features";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({
      tier: "free",
      status: "active",
      features: DEFAULT_FEATURES,
    });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({
      tier: "free",
      status: "active",
      features: DEFAULT_FEATURES,
    });
  }

  try {
    const res = await fetch(`${API_BASE}/runtime/judge/stripe/subscription`, {
      headers: await stripeApiHeaders(user.id),
      cache: "no-store",
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json({
      tier: "free",
      status: "active",
      features: DEFAULT_FEATURES,
    });
  }
}
