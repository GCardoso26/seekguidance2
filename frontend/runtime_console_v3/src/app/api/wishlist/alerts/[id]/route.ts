import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";
import {
  mockPriceAlertDelete,
  mockPriceAlertUpdate,
} from "@/lib/wishlist-price-alerts-mock";

type Params = { params: Promise<{ id: string }> };

async function resolveUser() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await resolveUser();
  if (!user) return NextResponse.json({ detail: "Não autenticado" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/marketplace/wishlist/alerts/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: await tournamentProxyHeaders(req),
        body: JSON.stringify(body),
        cache: "no-store",
      },
    );
    if (res.status !== 404 && res.status !== 501) {
      const text = await res.text();
      return new NextResponse(text, {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch {
    // stub
  }

  const updated = mockPriceAlertUpdate(user.id, id, body as never);
  if (!updated) {
    return NextResponse.json({ detail: "Alerta não encontrado" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await resolveUser();
  if (!user) return NextResponse.json({ detail: "Não autenticado" }, { status: 401 });

  try {
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/marketplace/wishlist/alerts/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: await tournamentProxyHeaders(),
        cache: "no-store",
      },
    );
    if (res.status !== 404 && res.status !== 501) {
      const text = await res.text();
      return new NextResponse(text, {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch {
    // stub
  }

  const removed = mockPriceAlertDelete(user.id, id);
  if (!removed) {
    return NextResponse.json({ detail: "Alerta não encontrado" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
