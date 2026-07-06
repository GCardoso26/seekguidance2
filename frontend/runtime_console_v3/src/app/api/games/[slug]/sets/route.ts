import { NextResponse } from "next/server";
import { fetchApiResilient } from "@/lib/api-proxy-base";

type RouteParams = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { slug } = await params;
  try {
    const res = await fetchApiResilient(
      `/runtime/judge/catalog/games/${encodeURIComponent(slug)}/sets`,
      { cache: "no-store" },
    );
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ sets: [] }, { status: 503 });
  }
}
