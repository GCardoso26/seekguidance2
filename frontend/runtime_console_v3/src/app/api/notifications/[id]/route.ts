import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mockDeleteNotification } from "@/lib/notifications-mock";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ detail: "Autenticação indisponível" }, { status: 503 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ detail: "Não autenticado" }, { status: 401 });

  try {
    const source = request.nextUrl.searchParams.get("source") || "social";
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/notifications/${id}?source=${encodeURIComponent(source)}`,
      {
        method: "DELETE",
        headers: await tournamentProxyHeaders(request),
        cache: "no-store",
      },
    );
    if (res.ok) {
      return new NextResponse(await res.text(), {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch {
    // stub
  }

  const ok = mockDeleteNotification(user.id, id);
  if (!ok) return NextResponse.json({ detail: "Notificação não encontrada" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
