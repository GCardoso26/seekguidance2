import { NextRequest, NextResponse } from "next/server";
import { getSettingsWithMockFallback, patchSettingsOverlay } from "@/lib/seller-settings-bff";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

async function fetchSellerSettingsFromApi(): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/seller/settings`, {
      headers: await tournamentProxyHeaders(),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await ctx.params;
  const apiPayload = await fetchSellerSettingsFromApi();
  return NextResponse.json(getSettingsWithMockFallback(storeId, apiPayload ?? undefined));
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as {
    section?: string;
    data?: Record<string, unknown>;
  };
  const section = body.section ?? "store";
  const data = body.data ?? {};

  if (section === "store") {
    try {
      const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/seller/settings`, {
        method: "PUT",
        headers: await tournamentProxyHeaders(),
        body: JSON.stringify({
          name: data.name,
          description: data.description,
        }),
        cache: "no-store",
      });
      if (!res.ok && res.status < 500) {
        const text = await res.text();
        return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
      }
    } catch {
      // overlay fallback
    }
  }

  if (section === "payments") {
    try {
      const res = await fetch(
        `${TOURNAMENT_API_BASE}/runtime/judge/marketplace/shop/stores/${encodeURIComponent(storeId)}/payment-settings`,
        {
          method: "PUT",
          headers: await tournamentProxyHeaders(),
          body: JSON.stringify({
            pix_key: data.pix_key,
            pix_key_type: data.pix_key_type,
            payment_method_preference: data.payment_method_preference ?? "pix",
          }),
          cache: "no-store",
        },
      );
      if (!res.ok && res.status < 500) {
        const text = await res.text();
        return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
      }
    } catch {
      // overlay fallback
    }
  }

  const merged = patchSettingsOverlay(storeId, section, data);
  return NextResponse.json(merged);
}
