import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHttpClient, ApiError } from "@/src/api/client";
import { createAuthApiClient } from "@/src/api/auth.client";
import {
  __resetSessionForTests,
  getAccessToken,
  getCurrentUser,
  getRefreshToken,
} from "@/src/auth/session";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("AuthApiClient", () => {
  beforeEach(() => {
    __resetSessionForTests();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    __resetSessionForTests();
  });

  it("login sucesso atualiza sessão", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        accessToken: "access-1",
        refreshToken: "refresh-1",
        expiresIn: 900,
        userId: "u1",
        roles: ["buyer"],
        sessionId: "s1",
      }),
    );

    const http = createHttpClient({ baseUrl: "" });
    const auth = createAuthApiClient(http);
    const session = await auth.login({ email: "a@b.com", password: "password1" });

    expect(session.accessToken).toBe("access-1");
    expect(getAccessToken()).toBe("access-1");
    expect(getRefreshToken()).toBe("refresh-1");
    expect(getCurrentUser()?.userId).toBe("u1");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/auth/login",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("login erro propaga ApiError", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(401, { error: "invalid_credentials" }),
    );
    const auth = createAuthApiClient(createHttpClient());
    await expect(auth.login({ email: "a@b.com", password: "bad" })).rejects.toBeInstanceOf(
      ApiError,
    );
    expect(getAccessToken()).toBeNull();
  });

  it("refresh usa refresh token persistido", async () => {
    sessionStorage.setItem("judgetcg.refreshToken", "refresh-old");
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(200, {
        accessToken: "access-2",
        refreshToken: "refresh-2",
        expiresIn: 900,
        userId: "u1",
        roles: ["buyer", "seller"],
        sessionId: "s2",
      }),
    );

    const auth = createAuthApiClient(createHttpClient());
    const session = await auth.refresh();
    expect(session.accessToken).toBe("access-2");
    expect(getRefreshToken()).toBe("refresh-2");
    expect(getCurrentUser()?.roles).toContain("seller");
  });

  it("logout limpa sessão", async () => {
    sessionStorage.setItem("judgetcg.refreshToken", "refresh-x");
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(200, { ok: true }));

    const auth = createAuthApiClient(createHttpClient());
    await auth.logout();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(getCurrentUser()).toBeNull();
  });
});
