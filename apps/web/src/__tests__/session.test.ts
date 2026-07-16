import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  __resetSessionForTests,
  applyAuthSession,
  clearSession,
  getAccessToken,
  hasSessionMaterial,
  isAccessTokenExpired,
} from "@/src/auth/session";

describe("session", () => {
  beforeEach(() => {
    __resetSessionForTests();
  });

  afterEach(() => {
    __resetSessionForTests();
  });

  it("token ausente → sem material de sessão / expirado", () => {
    expect(getAccessToken()).toBeNull();
    expect(hasSessionMaterial()).toBe(false);
    expect(isAccessTokenExpired()).toBe(true);
  });

  it("token expirado", () => {
    applyAuthSession({
      accessToken: "a",
      refreshToken: "r",
      expiresIn: 0,
      userId: "u",
      roles: ["buyer"],
      sessionId: "s",
    });
    expect(isAccessTokenExpired(Date.now() + 10_000)).toBe(true);
  });

  it("usuário autenticado", () => {
    const user = applyAuthSession(
      {
        accessToken: "a",
        refreshToken: "r",
        expiresIn: 900,
        userId: "u1",
        roles: ["buyer"],
        sessionId: "s1",
      },
      { email: "u@example.com" },
    );
    expect(user.userId).toBe("u1");
    expect(user.email).toBe("u@example.com");
    expect(getAccessToken()).toBe("a");
    expect(hasSessionMaterial()).toBe(true);
    expect(isAccessTokenExpired()).toBe(false);
    clearSession();
    expect(getAccessToken()).toBeNull();
  });
});
