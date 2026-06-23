import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE } from "@/lib/tournament-api";

export const maxDuration = 300;

const API_BASE = (process.env.API_PROXY_TARGET || TOURNAMENT_API_BASE).replace(/\/$/, "");

function authorizeCron(req: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET não configurado" }, { status: 503 });
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

async function proxyCatalogSync(req: NextRequest) {
  const denied = authorizeCron(req);
  if (denied) return denied;

  const game = req.nextUrl.searchParams.get("game");
  const full = req.nextUrl.searchParams.get("full") === "true";
  const qs = `full=${full}`;
  const path = game
    ? `/runtime/judge/catalog/cron/sync/${encodeURIComponent(game)}?${qs}`
    : `/runtime/judge/catalog/cron/sync?${qs}`;

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    const text = await res.text();
    let body: unknown = {};
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      body = { detail: text };
    }
    return NextResponse.json(body, { status: res.status });
  } catch {
    return NextResponse.json({ error: "API indisponível" }, { status: 503 });
  }
}

/** Vercel Cron e GitHub Actions podem usar GET ou POST. */
export async function GET(req: NextRequest) {
  return proxyCatalogSync(req);
}

export async function POST(req: NextRequest) {
  return proxyCatalogSync(req);
}
