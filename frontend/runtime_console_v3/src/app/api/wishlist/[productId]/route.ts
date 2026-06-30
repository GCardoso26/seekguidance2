import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";
import { mockWishlistRemove } from "@/lib/wishlist-mock";

type Params = { params: Promise<{ productId: string }> };

async function resolveUser() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { productId } = await params;
  const user = await resolveUser();
  if (!user) {
    return NextResponse.json({ detail: "Não autenticado" }, { status: 401 });
  }

  try {
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/marketplace/wishlist/${encodeURIComponent(productId)}`,
      {
        method: "DELETE",
        headers: await tournamentProxyHeaders(req),
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
    // stub abaixo
  }

  const removed = mockWishlistRemove(user.id, productId);
  if (!removed) {
    return NextResponse.json({ detail: "Item não encontrado" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
