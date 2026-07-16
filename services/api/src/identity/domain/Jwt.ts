/**
 * JWT ports (Sprint 4.3). Domain never signs tokens — adapters do.
 * AccessToken + RefreshToken are opaque strings once signed.
 */

export interface AccessTokenClaims {
  /** User id */
  sub: string;
  /** Session id (revocation source of truth) */
  sid: string;
  typ: "access";
  roles: string[];
  /** Expiry unix seconds */
  exp: number;
  iat: number;
}

export interface RefreshTokenClaims {
  sub: string;
  sid: string;
  typ: "refresh";
  exp: number;
  iat: number;
}

export type TokenClaims = AccessTokenClaims | RefreshTokenClaims;

export interface JwtSigner {
  signAccess(claims: Omit<AccessTokenClaims, "typ" | "iat" | "exp">, ttlSec: number): string;
  signRefresh(claims: Omit<RefreshTokenClaims, "typ" | "iat" | "exp">, ttlSec: number): string;
}

export interface JwtVerifier {
  verify(token: string): TokenClaims;
}

export class JwtError extends Error {
  constructor(
    message: string,
    readonly code: "invalid_token" | "expired_token" | "wrong_type",
  ) {
    super(message);
    this.name = "JwtError";
  }
}
