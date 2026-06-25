import { NextResponse } from "next/server";
import { fetchApiResilient } from "@/lib/api-proxy-base";

export const maxDuration = 60;
export const revalidate = 60;

const FALLBACK = {
  total_cards: 0,
  by_game: {},
  missing_images: [],
  missing_prices: [],
  last_sync: {},
  ready_for_marketplace: false,
  status: "loading",
  lite: true,
  degraded: true,
};

export async function GET() {
  try {
    const res = await fetchApiResilient(`/runtime/judge/catalog/health?lite=1`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json({ ...FALLBACK, upstream_status: res.status }, { status: 200 });
    }

    const data = (await res.json()) as Record<string, unknown>;
    const ready = Boolean(data.ready_for_marketplace);
    return NextResponse.json(
      {
        ...data,
        status: ready ? "ready_for_marketplace" : "loading",
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(FALLBACK, { status: 200 });
  }
}
