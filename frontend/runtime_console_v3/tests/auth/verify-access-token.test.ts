import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";
import { verifyRuntimeAccessToken, verifySupabaseAccessToken } from "@/lib/auth/verify-access-token";

const SECRET = "test-secret-at-least-32-chars-long";

function signRuntimeAccess(payload: Record<string, unknown>): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function signSupabaseJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
}

describe("verifyRuntimeAccessToken", () => {
  it("aceita token válido com role admin", async () => {
    const token = signRuntimeAccess({
      sub: "user-1",
      role: "admin",
      typ: "access",
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    const payload = await verifyRuntimeAccessToken(token, SECRET);
    expect(payload?.role).toBe("admin");
  });

  it("rejeita assinatura inválida", async () => {
    const token = signRuntimeAccess({
      sub: "user-1",
      role: "admin",
      typ: "access",
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    const forged = `${token.slice(0, -1)}x`;
    expect(await verifyRuntimeAccessToken(forged, SECRET)).toBeNull();
  });

  it("rejeita token expirado", async () => {
    const token = signRuntimeAccess({
      sub: "user-1",
      role: "admin",
      typ: "access",
      exp: Math.floor(Date.now() / 1000) - 60,
    });
    expect(await verifyRuntimeAccessToken(token, SECRET)).toBeNull();
  });
});

describe("verifySupabaseAccessToken", () => {
  it("aceita JWT HS256 válido", async () => {
    const token = signSupabaseJwt({
      sub: "user-1",
      email: "admin@judgetcg.com.br",
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    const payload = await verifySupabaseAccessToken(token, SECRET);
    expect(payload?.email).toBe("admin@judgetcg.com.br");
  });

  it("rejeita payload forjado sem HMAC", async () => {
    const header = Buffer.from(JSON.stringify({ alg: "HS256" })).toString("base64url");
    const body = Buffer.from(JSON.stringify({ sub: "x", role: "admin" })).toString("base64url");
    expect(await verifySupabaseAccessToken(`${header}.${body}.forged`, SECRET)).toBeNull();
  });
});
