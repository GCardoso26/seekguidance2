/** Verificação HMAC de tokens no middleware (Edge-safe via Web Crypto). */

import type { RuntimeTokenPayload } from "@/lib/decode-runtime-token";

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(data: string): Uint8Array {
  const pad = "=".repeat((4 - (data.length % 4)) % 4);
  const b64 = data.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

async function hmacSha256Base64Url(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return bytesToBase64Url(new Uint8Array(sig));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function payloadFromJson(raw: Record<string, unknown>): RuntimeTokenPayload {
  return {
    role: typeof raw.role === "string" ? raw.role : undefined,
    username: typeof raw.username === "string" ? raw.username : undefined,
    sub: typeof raw.sub === "string" ? raw.sub : undefined,
    tenant_id: typeof raw.tenant_id === "string" ? raw.tenant_id : undefined,
    email: typeof raw.email === "string" ? raw.email : undefined,
  };
}

/** Token runtime (`body.sig`, typ=access) emitido pelo FastAPI. */
export async function verifyRuntimeAccessToken(
  token: string,
  secret: string,
): Promise<RuntimeTokenPayload | null> {
  const sec = secret.trim();
  if (!sec || !token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;

  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = await hmacSha256Base64Url(body, sec);
  if (!timingSafeEqual(sig, expected)) return null;

  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(body))) as Record<string, unknown>;
    const exp = payload.exp;
    if (exp != null && Number(exp) < Date.now() / 1000) return null;
    if (payload.typ !== "access") return null;
    if (!payload.sub) return null;
    return payloadFromJson(payload);
  } catch {
    return null;
  }
}

/** JWT Supabase Auth (HS256, header.payload.sig). */
export async function verifySupabaseAccessToken(
  token: string,
  secret: string,
): Promise<RuntimeTokenPayload | null> {
  const sec = secret.trim();
  if (!sec || token.split(".").length !== 3) return null;

  const [headerB64, payloadB64, sigB64] = token.split(".", 3);
  const signingInput = `${headerB64}.${payloadB64}`;
  const expected = await hmacSha256Base64Url(signingInput, sec);
  if (!timingSafeEqual(expected, sigB64)) return null;

  try {
    const header = JSON.parse(new TextDecoder().decode(base64UrlToBytes(headerB64))) as Record<string, unknown>;
    if (header.alg != null && header.alg !== "HS256") return null;

    const payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payloadB64))) as Record<string, unknown>;
    const exp = payload.exp;
    if (exp != null && Number(exp) < Date.now() / 1000) return null;
    if (!payload.sub) return null;
    return payloadFromJson(payload);
  } catch {
    return null;
  }
}
