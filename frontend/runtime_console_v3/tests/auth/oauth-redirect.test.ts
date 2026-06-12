import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearOAuthRedirectState,
  isOAuthReturnPath,
  peekOAuthRedirectTarget,
  setOAuthRedirectTarget,
  tryConsumeOAuthRedirect,
} from "@/lib/auth/oauth-redirect";

describe("oauth-redirect", () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    vi.stubGlobal("window", {
      location: {
        pathname: "/",
        search: "",
        hash: "",
        replace: vi.fn(),
      },
    });
    vi.stubGlobal("sessionStorage", {
      getItem: (k: string) => store.get(`s:${k}`) ?? null,
      setItem: (k: string, v: string) => store.set(`s:${k}`, v),
      removeItem: (k: string) => store.delete(`s:${k}`),
    });
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store.get(`l:${k}`) ?? null,
      setItem: (k: string, v: string) => store.set(`l:${k}`, v),
      removeItem: (k: string) => store.delete(`l:${k}`),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("retorna /judge quando oauth_pending na home", () => {
    setOAuthRedirectTarget("/judge");
    expect(peekOAuthRedirectTarget()).toBe("/judge");
    expect(tryConsumeOAuthRedirect()).toBe("/judge");
    expect(store.has("l:oauth_pending")).toBe(false);
  });

  it("não consome flags em /judge (preserva para bounce)", () => {
    setOAuthRedirectTarget("/judge");
    window.location.pathname = "/judge";
    expect(peekOAuthRedirectTarget()).toBeNull();
    expect(tryConsumeOAuthRedirect()).toBeNull();
    expect(store.has("l:oauth_pending")).toBe(true);
  });

  it("usa fallback localStorage quando sessionStorage está vazio", () => {
    const data = JSON.stringify({ target: "/judge", timestamp: Date.now() });
    store.set("l:oauth_pending", data);
    expect(tryConsumeOAuthRedirect()).toBe("/judge");
  });

  it("detecta from_oauth=1 na URL", () => {
    window.location.search = "?from_oauth=1";
    expect(peekOAuthRedirectTarget()).toBe("/judge");
  });

  it("isOAuthReturnPath identifica home e callback", () => {
    expect(isOAuthReturnPath("/")).toBe(true);
    expect(isOAuthReturnPath("/auth/callback")).toBe(true);
    expect(isOAuthReturnPath("/judge")).toBe(false);
  });

  it("limpa estado stale via clearOAuthRedirectState", () => {
    setOAuthRedirectTarget("/player/me");
    clearOAuthRedirectState();
    expect(store.has("s:oauth_redirect")).toBe(false);
    expect(tryConsumeOAuthRedirect()).toBeNull();
  });
});
