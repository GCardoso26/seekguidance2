import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  AccessTokenClaims,
  JwtSigner,
  JwtVerifier,
  RefreshTokenClaims,
  TokenClaims,
} from "../domain/Jwt.js";
import { JwtError } from "../domain/Jwt.js";

/**
 * HMAC-SHA256 JWT adapter (no external deps).
 * Format: header.payload.signature — standard JWT, HS256.
 */
export class HmacJwtAdapter implements JwtSigner, JwtVerifier {
  constructor(private readonly secret: string) {
    if (!secret || secret.length < 16) {
      throw new Error("jwt_secret_too_short");
    }
  }

  signAccess(
    claims: Omit<AccessTokenClaims, "typ" | "iat" | "exp">,
    ttlSec: number,
  ): string {
    const now = Math.floor(Date.now() / 1000);
    return this.encode({
      ...claims,
      typ: "access",
      iat: now,
      exp: now + ttlSec,
    });
  }

  signRefresh(
    claims: Omit<RefreshTokenClaims, "typ" | "iat" | "exp">,
    ttlSec: number,
  ): string {
    const now = Math.floor(Date.now() / 1000);
    return this.encode({
      ...claims,
      typ: "refresh",
      iat: now,
      exp: now + ttlSec,
    });
  }

  verify(token: string): TokenClaims {
    const parts = token.split(".");
    if (parts.length !== 3) throw new JwtError("malformed", "invalid_token");
    const headerB64 = parts[0]!;
    const payloadB64 = parts[1]!;
    const sigB64 = parts[2]!;
    const expected = this.sign(`${headerB64}.${payloadB64}`);
    if (!signaturesMatch(expected, sigB64)) {
      throw new JwtError("bad_signature", "invalid_token");
    }

    let payload: TokenClaims;
    try {
      payload = JSON.parse(b64UrlDecode(payloadB64)) as TokenClaims;
    } catch {
      throw new JwtError("bad_payload", "invalid_token");
    }
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
      throw new JwtError("expired", "expired_token");
    }
    if (payload.typ !== "access" && payload.typ !== "refresh") {
      throw new JwtError("unknown_typ", "wrong_type");
    }
    return payload;
  }

  private encode(claims: TokenClaims): string {
    const header = b64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = b64UrlEncode(JSON.stringify(claims));
    const sig = this.sign(`${header}.${payload}`);
    return `${header}.${payload}.${sig}`;
  }

  private sign(data: string): string {
    return createHmac("sha256", this.secret).update(data).digest("base64url");
  }
}

function signaturesMatch(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

function b64UrlEncode(s: string): string {
  return Buffer.from(s, "utf8").toString("base64url");
}

function b64UrlDecode(s: string): string {
  return Buffer.from(s, "base64url").toString("utf8");
}
