/**
 * Identity domain models (Sprint 4.1) — domain only, no JWT yet.
 *
 * Principle: identity ≠ role. `User` is who someone is; being a seller is a ROLE
 * (bridged by SellerProfile), never a field on User. See IDENTITY_DOMAIN.md.
 */

export type UserStatus = "active" | "disabled";

/** Aggregate root — pure identity. Never holds listings/inventory/seller data. */
export interface User {
  id: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  /** Opaque hash; null until a password is set. Never the plaintext. */
  passwordHash: string | null;
  status: UserStatus;
  rowVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserUpsert {
  id?: string;
  email: string;
  displayName: string;
  passwordHash?: string | null;
  emailVerified?: boolean;
  status?: UserStatus;
  expectedVersion?: number;
}

/** Aggregate — the bridge Identity → Marketplace. Never copies Seller data. */
export interface SellerProfile {
  id: string;
  userId: string;
  sellerId: string;
  rowVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SellerProfileUpsert {
  id?: string;
  userId: string;
  sellerId: string;
  expectedVersion?: number;
}

/** Aggregate — login session (base for Refresh Token in 4.3). */
export interface Session {
  id: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface CreateSessionInput {
  id?: string;
  userId: string;
  ttlMs: number;
}

export type RoleName = "buyer" | "seller" | "admin";

export type Permission =
  | "seller:manage"
  | "inventory:write"
  | "listing:write"
  | "listing:delete"
  | "admin:all";

export interface UserRoleAssignment {
  userId: string;
  role: RoleName;
  createdAt: Date;
}

/**
 * FROZEN CONTRACT — not implemented in Sprint 4.2 (see IDENTITY_DOMAIN.md).
 * Declared now so `register → token → confirm → emailVerified=true` stays clean later.
 */
export interface EmailVerificationToken {
  token: string;
  userId: string;
  expiresAt: Date;
  consumedAt: Date | null;
}

/** FROZEN CONTRACT — not implemented. `request → token → reset`. */
export interface PasswordResetToken {
  token: string;
  userId: string;
  expiresAt: Date;
  consumedAt: Date | null;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isSessionActive(session: Session, now: Date): boolean {
  return session.revokedAt == null && session.expiresAt.getTime() > now.getTime();
}
