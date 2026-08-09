/**
 * Tournament Platform — store events (públicos + criação seller).
 *
 * POST body esperado (create):
 * {
 *   store_id, name, description?, game?, format?, category?,
 *   event_type?, capacity?, starts_at?, venue?, rules?,
 *   banner_url?, image_url?, visibility?, status?,
 *   policies?: {
 *     address_city, address_state, address_cep, contact_phone,
 *     pairing_format, notes
 *   }
 * }
 */
import { NextRequest, NextResponse } from "next/server";
import { fetchApiResilient } from "@/lib/api-proxy-base";
import { tournamentProxyHeaders } from "@/lib/tournament-api";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const qs = new URLSearchParams();
  for (const key of ["store_id", "game", "limit", "owner"] as const) {
    const v = sp.get(key);
    if (v) qs.set(key, v);
  }
  const q = qs.toString();
  try {
    const headers = await tournamentProxyHeaders(req);
    const res = await fetchApiResilient(`/runtime/events${q ? `?${q}` : ""}`, {
      headers,
      cache: "no-store",
    });
    if (!sp.get("store_id") && !sp.get("owner") && (res.status === 401 || res.status === 403)) {
      return NextResponse.json({ events: [] }, { status: 200 });
    }
    return new NextResponse(await res.text(), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json({ detail: "API indisponível", events: [] }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const res = await fetchApiResilient(`/runtime/judge/tournament-platform/events`, {
      method: "POST",
      headers: await tournamentProxyHeaders(req),
      body,
      cache: "no-store",
    });
    return new NextResponse(await res.text(), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
