import { NextRequest, NextResponse } from "next/server";

const API_TARGET = (process.env.API_PROXY_TARGET || "http://127.0.0.1:8000").replace(/\/$/, "");

function misconfiguredTarget(): boolean {
  try {
    const u = new URL(API_TARGET);
    return u.pathname.includes("/api/proxy");
  } catch {
    return API_TARGET.includes("/api/proxy");
  }
}

async function proxy(request: NextRequest, path: string[]): Promise<NextResponse> {
  if (misconfiguredTarget()) {
    return NextResponse.json(
      {
        error: "api_proxy_misconfigured",
        detail:
          "API_PROXY_TARGET must be the Render API root (e.g. https://seekguidance.onrender.com), not /api/proxy on this domain.",
      },
      { status: 500 },
    );
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
