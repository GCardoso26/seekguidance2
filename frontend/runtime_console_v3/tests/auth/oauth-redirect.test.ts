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
    const replace = vi.fn();
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
    vi.stubGlobal("window", {
      location: {
        pathname: "/",
        search: "",
        hash: "",
        replace,
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("redireciona quando oauth_pending e sessão ativa na home", () => {
    setOAuthRedirectTarget("/judge");
    const redirected = tryConsumeOAuthRedirect(true);
    expect(redirected).toBe(true);
    expect(window.location.replace).toHaveBeenCalledWith("/judge");
  });

  it("não redireciona usuário logado na home sem fluxo OAuth pendente", () => {
    const redirected = tryConsumeOAuthRedirect(true);
    expect(redirected).toBe(false);
    expect(window.location.replace).not.toHaveBeenCalled();
  });

  it("limpa estado stale", () => {
    setOAuthRedirectTarget("/player/me");
    clearOAuthRedirectState();
    expect(store.has("s:oauth_pending")).toBe(false);
    expect(store.has("l:oauth_next")).toBe(false);
  });
});
