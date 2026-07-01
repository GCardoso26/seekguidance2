import { NextRequest, NextResponse } from "next/server";
import { API_PROXY_BASE } from "@/lib/api-proxy-base";
import { cardVersionsMock } from "@/lib/card-versions-mock";

type Params = { params: Promise<{ cardId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { cardId } = await params;
  const { searchParams } = request.nextUrl;

  try {
    const res = await fetch(
      `${API_PROXY_BASE}/runtime/judge/catalog/cards/${encodeURIComponent(cardId)}/versions?${searchParams}`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) throw new Error(`Backend ${res.status}`);
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json(cardVersionsMock.getVersions(cardId, searchParams));
  }
}
