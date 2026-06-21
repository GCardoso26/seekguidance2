import { NextRequest, NextResponse } from "next/server";

const API_BASE = (process.env.API_PROXY_TARGET || "http://127.0.0.1:8000").replace(/\/$/, "");

type RouteParams = { params: Promise<{ cardId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { cardId } = await params;
  const incoming = request.nextUrl.searchParams;

  const query = new URLSearchParams();
  query.set("range", incoming.get("range") || "30d");
  const condition = incoming.get("condition");
  const foil = incoming.get("foil");
  if (condition) query.set("condition", condition);
  if (foil !== null && foil !== "") query.set("foil", foil);

  try {
    const res = await fetch(
      `${API_BASE}/runtime/judge/catalog/cards/${encodeURIComponent(cardId)}/price-history?${query}`,
      {
        headers: {
          "X-Judge-User-Id": request.headers.get("X-Judge-User-Id") || "",
        },
        next: { revalidate: 300 },
      },
    );

    if (res.status === 404) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch price history" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch price history" }, { status: 500 });
  }
}
