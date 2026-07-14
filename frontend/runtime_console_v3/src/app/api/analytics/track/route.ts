import { NextRequest, NextResponse } from "next/server";
import { API_BASE } from "@/lib/stripe/stripe-api-headers";
import { getClientIp } from "@/lib/api/plan-enforcement";
import { checkRateLimit } from "@/lib/api/rate-limit";

const MAX_BODY_BYTES = 8_192;
const MAX_EVENTS = 20;

/**
 * Soft HTTP 200 keeps browsers/Lighthouse quiet (RC1.2).
 * Integrity is never silent: body.ok / lost / dead_lettered always report fate of events.
 */
function soft(ok: boolean, detail?: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok, ...(detail ? { detail } : {}), ...extra }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`analytics:${ip}`, 60, 60_000)) {
    return soft(false, "Rate limit exceeded", { lost: -1, persisted: 0, dead_lettered: 0 });
  }

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    return soft(false, "Payload too large", { lost: -1, persisted: 0, dead_lettered: 0 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return soft(false, "Invalid JSON", { lost: -1, persisted: 0, dead_lettered: 0 });
  }

  if (!body || typeof body !== "object") {
    return soft(false, "Invalid payload", { lost: -1, persisted: 0, dead_lettered: 0 });
  }

  const events = (body as { events?: unknown }).events;
  if (!Array.isArray(events) || events.length === 0 || events.length > MAX_EVENTS) {
    return soft(false, "Invalid events array", { lost: -1, persisted: 0, dead_lettered: 0 });
  }

  try {
    const res = await fetch(`${API_BASE}/runtime/judge/analytics/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: raw,
      cache: "no-store",
    });
    const text = await res.text();
    let upstream: Record<string, unknown> = {};
    try {
      upstream = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      upstream = {};
    }

    if (!res.ok) {
      return soft(false, "Upstream rejected", {
        status: res.status,
        lost: events.length,
        persisted: 0,
        dead_lettered: 0,
        ...upstream,
      });
    }

    const lost = typeof upstream.lost === "number" ? upstream.lost : 0;
    const ok = upstream.ok !== false && lost === 0;
    return NextResponse.json(
      {
        ok,
        received: upstream.received ?? events.length,
        persisted: upstream.persisted ?? upstream.received ?? 0,
        dead_lettered: upstream.dead_lettered ?? 0,
        duplicates: upstream.duplicates ?? 0,
        lost,
        ingest_trace_id: upstream.ingest_trace_id,
        details: upstream.details,
      },
      { status: 200 },
    );
  } catch {
    return soft(false, "Analytics indisponível", {
      lost: events.length,
      persisted: 0,
      dead_lettered: 0,
    });
  }
}
