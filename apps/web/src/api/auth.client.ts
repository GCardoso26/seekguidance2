import type { HttpClient } from "@/src/api/client";
import {
  applyAuthSession,
  clearSession,
  getRefreshToken,
} from "@/src/auth/session";
import type {
  AuthSession,
  LoginInput,
  RegisterInput,
  UserResponse,
} from "@/src/types/auth";

export interface AuthApiClient {
  register(input: RegisterInput): Promise<UserResponse>;
  login(input: LoginInput): Promise<AuthSession>;
  refresh(): Promise<AuthSession>;
  logout(): Promise<void>;
}

/**
 * Auth HTTP client — request, error interpretation, session update.
 * Does not decide permissions or seller rules.
 */
export function createAuthApiClient(http: HttpClient): AuthApiClient {
  return {
    async register(input) {
      return http.post<UserResponse>("/api/v1/auth/register", input, { auth: false });
    },

    async login(input) {
      const session = await http.post<AuthSession>("/api/v1/auth/login", input, {
        auth: false,
      });
      applyAuthSession(session, { email: input.email });
      return session;
    },

    async refresh() {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearSession();
        throw new Error("refresh_token_absent");
      }
      const session = await http.post<AuthSession>(
        "/api/v1/auth/refresh",
        { refreshToken },
        { auth: false },
      );
      applyAuthSession(session);
      return session;
    },

    async logout() {
      const refreshToken = getRefreshToken();
      try {
        if (refreshToken) {
          await http.post("/api/v1/auth/logout", { refreshToken }, { auth: false });
        }
      } finally {
        clearSession();
      }
    },
  };
}
