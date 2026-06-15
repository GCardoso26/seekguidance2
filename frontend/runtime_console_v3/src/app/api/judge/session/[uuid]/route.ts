import { NextRequest, NextResponse } from "next/server";
import { API_BASE } from "@/lib/stripe/stripe-api-headers";
import { getAuthenticatedUserId } from "@/lib/api/supabase-user";

type Params = { params: Promise<{ uuid: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { uuid } = await params;
  const userId = await getAuthenticatedUserId();
  const headers: Record<string, string> = {};
  if (userId) headers["X-Judge-User-Id"] = userId;

  const res = await fetch(`${API_BASE}/runtime/judge/session/${uuid}`, {
    headers,
    cache: "no-store",
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
