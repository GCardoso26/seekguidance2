import { NextResponse } from "next/server";

const API_BASE = (process.env.API_PROXY_TARGET || process.env.NEXT_PUBLIC_API_URL || "https://seekguidance.onrender.com").replace(
  /\/$/,
  "",
);

export const revalidate = 3600;

export async function GET() {
  try {
    const res = await fetch(`${API_BASE}/runtime/judge/sellers/featured?limit=6`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      return NextResponse.json({ shops: [], error: "upstream_unavailable" }, { status: 200 });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ shops: [], error: "fetch_failed" }, { status: 200 });
  }
}
