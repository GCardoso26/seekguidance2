import { NextRequest, NextResponse } from "next/server";
import { API_BASE } from "@/lib/stripe/stripe-api-headers";
import { getClientIp } from "@/lib/api/plan-enforcement";
import { checkRateLimit } from "@/lib/api/rate-limit";

const MAX_BODY_BYTES = 8_192;
const MAX_EVENTS = 20;

/** Telemetry is best-effort: always HTTP 200 so browsers / Lighthouse never log console errors. */
function soft(ok: boolean, detail?: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok, ...(detail ? { detail } : {}), ...extra }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`analytics:${ip}`, 60, 60_000)) {
    return soft(false, "Rate limit exceeded");
  }

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    return soft(false, "Payload too large");
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return soft(false, "Invalid JSON");
  }

  if (!body || typeof body !== "object") {
    return soft(false, "Invalid payload");
  }

  const events = (body as { events?: unknown }).events;
  if (!Array.isArray(events) || events.length === 0 || events.length > MAX_EVENTS) {
    return soft(false, "Invalid events array");
  }

  try {
    const res = await fetch(`${API_BASE}/runtime/judge/analytics/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: raw,
      cache: "no-store",
    });
    if (!res.ok) {
      return soft(false, "Upstream rejected", { status: res.status });
    }
    const text = await res.text();
    return new NextResponse(text || JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return soft(false, "Analytics indisponível");
  }
}
