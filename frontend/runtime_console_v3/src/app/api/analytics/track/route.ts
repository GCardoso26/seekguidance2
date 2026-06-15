import { NextRequest, NextResponse } from "next/server";
import { API_BASE } from "@/lib/stripe/stripe-api-headers";
import { getClientIp } from "@/lib/api/plan-enforcement";
import { checkRateLimit } from "@/lib/api/rate-limit";

const MAX_BODY_BYTES = 8_192;
const MAX_EVENTS = 20;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`analytics:${ip}`, 60, 60_000)) {
    return NextResponse.json({ detail: "Rate limit exceeded" }, { status: 429 });
  }

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ detail: "Payload too large" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ detail: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ detail: "Invalid payload" }, { status: 400 });
  }

  const events = (body as { events?: unknown }).events;
  if (!Array.isArray(events) || events.length === 0 || events.length > MAX_EVENTS) {
    return NextResponse.json({ detail: "Invalid events array" }, { status: 400 });
  }

  try {
    const res = await fetch(`${API_BASE}/runtime/judge/analytics/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: raw,
      cache: "no-store",
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json({ detail: "Analytics indisponível" }, { status: 503 });
  }
}
