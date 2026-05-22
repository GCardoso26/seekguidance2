import { NextRequest, NextResponse } from "next/server";

/** API Render em produção (override com API_PROXY_TARGET na Vercel). */
const RENDER_API_DEFAULT = "https://seekguidance.onrender.com";

function resolveApiTarget(): string {
  const raw = process.env.API_PROXY_TARGET?.trim();
  if (raw) return raw.replace(/\/$/, "");
  if (process.env.VERCEL === "1") return RENDER_API_DEFAULT;
  return "http://127.0.0.1:8000";
}

/** Mensagem clara em vez de DNS_HOSTNAME_RESOLVED_PRIVATE da Vercel. */
function validateApiTarget(target: string): string | null {
  let u: URL;
  try {
    u = new URL(target);
  } catch {
    return "API_PROXY_TARGET is not a valid URL";
  }
  if (!["http:", "https:"].includes(u.protocol)) {
    return "API_PROXY_TARGET must use http or https";
  }
  const host = u.hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".local")) {
    return "API_PROXY_TARGET cannot be localhost on Vercel — set https://seekguidance.onrender.com";
  }
  if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(host)) {
    return "API_PROXY_TARGET cannot be a private IP — use the public Render URL";
  }
  if (u.pathname.includes("/api/proxy") || host === "judgetcg.com.br") {
    return "API_PROXY_TARGET must be the Render API root only (e.g. https://seekguidance.onrender.com)";
  }
  return null;
}

async function proxy(request: NextRequest, path: string[]): Promise<NextResponse> {
  const API_TARGET = resolveApiTarget();
  const targetError = validateApiTarget(API_TARGET);
  if (targetError) {
    return NextResponse.json({ error: "api_proxy_misconfigured", detail: targetError }, { status: 500 });
  }

  const pathname = path.join("/");
  const search = request.nextUrl.search;
  const target = `${API_TARGET}/${pathname}${search}`;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text();
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, init);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "upstream fetch failed";
    return NextResponse.json({ error: "api_proxy_unreachable", detail: msg }, { status: 502 });
  }

  const body = await upstream.arrayBuffer();
  const out = new NextResponse(body, { status: upstream.status });
  upstream.headers.forEach((value, key) => {
    if (key.toLowerCase() === "transfer-encoding") return;
    out.headers.set(key, value);
  });
  return out;
}

type Ctx = { params: { path: string[] } };

export async function GET(request: NextRequest, ctx: Ctx) {
  return proxy(request, ctx.params.path);
}
export async function POST(request: NextRequest, ctx: Ctx) {
  return proxy(request, ctx.params.path);
}
export async function PUT(request: NextRequest, ctx: Ctx) {
  return proxy(request, ctx.params.path);
}
export async function PATCH(request: NextRequest, ctx: Ctx) {
  return proxy(request, ctx.params.path);
}
export async function DELETE(request: NextRequest, ctx: Ctx) {
  return proxy(request, ctx.params.path);
}
