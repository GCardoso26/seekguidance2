import { NextRequest, NextResponse } from "next/server";
import { API_BASE } from "@/lib/stripe/stripe-api-headers";
import { getAuthenticatedUserId } from "@/lib/api/supabase-user";

export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
  const body = await req.text();
  const res = await fetch(`${API_BASE}/runtime/judge/session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Judge-User-Id": userId,
    },
    body,
    cache: "no-store",
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
