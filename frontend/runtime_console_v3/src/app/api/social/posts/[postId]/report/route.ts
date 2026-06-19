import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

type Params = { params: Promise<{ postId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { postId } = await params;
  const body = await req.text();
  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/social/posts/${postId}/report`, {
      method: "POST",
      headers: await tournamentProxyHeaders(),
      body,
      cache: "no-store",
    });
    return new NextResponse(await res.text(), { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
