import { NextRequest, NextResponse } from "next/server";
import { fetchApiResilient } from "@/lib/api-proxy-base";
import { tournamentProxyHeaders } from "@/lib/tournament-api";

export async function GET(req: NextRequest) {
  try {
    const headers = await tournamentProxyHeaders(req);
    const email = req.headers.get("x-judge-user-email");
    if (email) headers["X-Judge-User-Email"] = email;
    const res = await fetchApiResilient("/runtime/judge/sandbox/status", {
      headers,
      cache: "no-store",
    });
    return new NextResponse(await res.text(), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json(
      {
        mode: process.env.NEXT_PUBLIC_APP_MODE || "development",
        elevated: false,
        demos: {
          store: false,
          events: false,
          financial: false,
          tournament: false,
          analytics: false,
        },
      },
      { status: 200 },
    );
  }
}
