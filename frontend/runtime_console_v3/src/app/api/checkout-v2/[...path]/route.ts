import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, API_KEY_COOKIE } from "@/lib/auth-cookies";

/** Checkout V2 BC — prefer dedicated URL, else API_PROXY_TARGET. */
const API_BASE = (
  process.env.CHECKOUT_V2_API_URL ||
  process.env.API_PROXY_TARGET ||
  "http://127.0.0.1:8000"
).replace(/\/$/, "");

async function proxy(req: NextRequest, pathParts: string[]) {
  const suffix = pathParts.join("/");
  const url = new URL(req.url);
  const target = `${API_BASE}/api/v1/checkout-v2/${suffix}${url.search}`;

  const jar = await cookies();
  const headers: Record<string, string> = {
    "Content-Type": req.headers.get("content-type") || "application/json",
  };
  const incomingAuth = req.headers.get("authorization");
  const access = jar.get(ACCESS_COOKIE)?.value;
  const apiKey = jar.get(API_KEY_COOKIE)?.value;
  if (incomingAuth) headers.Authorization = incomingAuth;
  else if (access) headers.Authorization = `Bearer ${access}`;
  if (apiKey) headers["X-API-Key"] = apiKey;
  const idem = req.headers.get("idempotency-key");
  if (idem) headers["Idempotency-Key"] = idem;

  const init: RequestInit = { method: req.method, headers, cache: "no-store" };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.text();
  }

  let apiHost = "unknown";
  try {
    apiHost = new URL(API_BASE).host;
  } catch {
    apiHost = "invalid_CHECKOUT_V2_API_URL";
  }

  try {
    const upstream = await fetch(target, init);
    const body = await upstream.text();
    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "application/json",
        "X-Checkout-V2-Upstream": apiHost,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        error: "checkout_v2_upstream_unreachable",
        upstreamHost: apiHost,
        detail: message.slice(0, 300),
      },
      { status: 502 },
    );
  }
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path ?? []);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path ?? []);
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path ?? []);
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path ?? []);
}
