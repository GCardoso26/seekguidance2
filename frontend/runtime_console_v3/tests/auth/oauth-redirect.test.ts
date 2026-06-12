import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearOAuthRedirectState,
  markOAuthLoginStarted,
  OAUTH_RETURN_COOKIE,
  peekOAuthRedirectTarget,
  setOAuthRedirectTarget,
  tryConsumeOAuthRedirect,
} from "@/lib/auth/oauth-redirect";

describe("oauth-redirect", () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    const cookies: Record<string, string> = {};
    vi.stubGlobal("document", {
      referrer: "",
      set cookie(value: string) {
        const [pair] = value.split(";");
        const [key, val] = pair.split("=");
        const name = key.trim();
        if (!val || value.includes("max-age=0")) {
          delete cookies[name];
          return;
        }
        cookies[name] = val.trim();
      },
      get cookie() {
        return Object.entries(cookies)
          .map(([k, v]) => `${k}=${v}`)
          .join("; ");
      },
    });
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

  it("grava cookie tcg_oauth_return ao iniciar OAuth", () => {
    setOAuthRedirectTarget("/judge");
    expect(document.cookie).toContain(`${OAUTH_RETURN_COOKIE}=%2Fjudge`);
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

  it("detecta from_oauth=1 na URL", () => {
    window.location.search = "?from_oauth=1";
    expect(peekOAuthRedirectTarget()).toBe("/judge");
  });

  it("fallback quando login OAuth foi iniciado recentemente", () => {
    markOAuthLoginStarted();
    expect(peekOAuthRedirectTarget()).toBe("/judge");
  });

  it("fallback quando referrer é Google", () => {
    vi.stubGlobal("document", { referrer: "https://accounts.google.com/o/oauth2/v2/auth" });
    expect(peekOAuthRedirectTarget()).toBe("/judge");
  });

  it("limpa estado stale via clearOAuthRedirectState", () => {
    setOAuthRedirectTarget("/player/me");
    clearOAuthRedirectState();
    expect(store.has("s:oauth_redirect")).toBe(false);
    expect(tryConsumeOAuthRedirect()).toBeNull();
  });
});
