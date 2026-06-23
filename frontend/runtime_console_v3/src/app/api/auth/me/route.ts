import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";
import { decodeRuntimeTokenPayload } from "@/lib/decode-runtime-token";

export async function GET() {
  const jar = await cookies();
  const access = jar.get(ACCESS_COOKIE)?.value;
  if (!access) {
    return NextResponse.json({ authenticated: false, role: "anonymous" });
  }

  const payload = decodeRuntimeTokenPayload(access);
  if (!payload) {
    return NextResponse.json({ authenticated: false, role: "anonymous" });
  }

  const role = String(payload.role ?? "viewer");
  return NextResponse.json({
    authenticated: true,
    username: payload.username ?? null,
    user_id: payload.sub ?? null,
    tenant_id: payload.tenant_id ?? "default",
    role,
    is_admin: role === "admin",
  });
}
