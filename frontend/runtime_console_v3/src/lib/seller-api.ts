import type { SellerProfile } from "@/types/seller";

const API_BASE = (process.env.API_PROXY_TARGET || "http://127.0.0.1:8000").replace(/\/$/, "");

export async function fetchSellerProfile(sellerId: string): Promise<SellerProfile | null> {
  try {
    const res = await fetch(
      `${API_BASE}/runtime/judge/sellers/${encodeURIComponent(sellerId)}/profile`,
      { next: { revalidate: 120 } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { seller: SellerProfile };
    return data.seller ?? null;
  } catch {
    return null;
  }
}
