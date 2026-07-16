import { NextRequest, NextResponse } from "next/server";
import { API_PROXY_BASE } from "@/lib/api-proxy-base";

type RouteParams = { params: Promise<{ cardId: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { cardId } = await params;

  try {
    const res = await fetch(
      `${API_PROXY_BASE}/runtime/judge/catalog/cards/${encodeURIComponent(cardId)}`,
      {
        headers: {
          "X-Judge-User-Id": _request.headers.get("X-Judge-User-Id") || "",
        },
        next: { revalidate: 60 },
      },
    );

    if (res.status === 404) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch card detail" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Card detail error:", error);
    return NextResponse.json({ error: "Failed to fetch card detail" }, { status: 500 });
  }
}
