/** Mirrors identity AuthTokens / register response — UX types only. */

export type RoleName = "buyer" | "seller" | "admin";

export type AuthState = "anonymous" | "authenticated" | "loading";

export interface UserResponse {
  id: string;
  email: string;
  displayName: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  userId: string;
  roles: RoleName[];
  sessionId: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface CurrentUser {
  userId: string;
  email?: string;
  displayName?: string;
  roles: RoleName[];
  sessionId: string;
}
