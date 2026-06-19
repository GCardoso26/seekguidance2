import { NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

type Params = { params: Promise<{ postId: string }> };

export async function POST(_req: Request, { params }: Params) {
  const { postId } = await params;
  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/social/posts/${postId}/save`, {
      method: "POST",
      headers: await tournamentProxyHeaders(),
      cache: "no-store",
    });
    return new NextResponse(await res.text(), { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
