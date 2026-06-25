import { NextResponse } from "next/server";
import { fetchApiResilient } from "@/lib/api-proxy-base";

export const revalidate = 60;

export async function GET() {
  try {
    const res = await fetchApiResilient(`/runtime/judge/catalog/health`, {
      next: { revalidate: 60 },
    });

    const data = (await res.json()) as Record<string, unknown>;
    const ready = Boolean(data.ready_for_marketplace);
    return NextResponse.json(
      {
        ...data,
        status: ready ? "ready_for_marketplace" : "loading",
      },
      { status: res.ok ? 200 : res.status },
    );
  } catch {
    return NextResponse.json({ error: "catalog_health_unavailable" }, { status: 503 });
  }
}
