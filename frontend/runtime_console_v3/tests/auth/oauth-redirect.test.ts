import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearOAuthRedirectState,
  setOAuthRedirectTarget,
  tryConsumeOAuthRedirect,
} from "@/lib/auth/oauth-redirect";

describe("oauth-redirect", () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    vi.stubGlobal("window", {});
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

  it("retorna /judge quando oauth_pending em sessionStorage", () => {
    setOAuthRedirectTarget("/judge");
    expect(tryConsumeOAuthRedirect()).toBe("/judge");
    expect(store.has("s:oauth_redirect")).toBe(false);
    expect(store.has("l:oauth_pending")).toBe(false);
  });

  it("usa fallback localStorage quando sessionStorage está vazio", () => {
    const data = JSON.stringify({ target: "/judge", timestamp: Date.now() });
    store.set("l:oauth_pending", data);
    expect(tryConsumeOAuthRedirect()).toBe("/judge");
  });

  it("retorna null sem fluxo OAuth pendente", () => {
    expect(tryConsumeOAuthRedirect()).toBeNull();
  });

  it("normaliza path sem barra inicial", () => {
    setOAuthRedirectTarget("player/me");
    expect(tryConsumeOAuthRedirect()).toBe("/player/me");
  });

  it("limpa estado stale via clearOAuthRedirectState", () => {
    setOAuthRedirectTarget("/player/me");
    clearOAuthRedirectState();
    expect(store.has("s:oauth_redirect")).toBe(false);
    expect(store.has("l:oauth_pending")).toBe(false);
    expect(tryConsumeOAuthRedirect()).toBeNull();
  });
});
