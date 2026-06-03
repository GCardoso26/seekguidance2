import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  buildAppRedirectUrl,
  buildOAuthCallbackUrl,
  getAppUrl,
  getRequestOrigin,
  isLocalhostUrl,
} from "@/lib/app-url";

describe("app-url", () => {
  const originalEnv = process.env.NEXT_PUBLIC_APP_URL;

  beforeEach(() => {
    vi.stubGlobal("window", undefined);
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = originalEnv;
    vi.unstubAllGlobals();
  });

  it("ignora NEXT_PUBLIC localhost quando origin é produção", () => {
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    vi.stubGlobal("window", { location: { origin: "https://judgetcg.com.br" } });
    expect(getAppUrl()).toBe("https://judgetcg.com.br");
    expect(buildOAuthCallbackUrl("/judge")).toBe(
      "https://judgetcg.com.br/auth/callback?next=%2Fjudge",
    );
  });

  it("usa NEXT_PUBLIC_APP_URL no servidor quando não é localhost", () => {
    delete (globalThis as { window?: unknown }).window;
    process.env.NEXT_PUBLIC_APP_URL = "https://judgetcg.com.br";
    expect(getAppUrl()).toBe("https://judgetcg.com.br");
  });

  it("getRequestOrigin usa x-forwarded-host", () => {
    const req = new Request("http://localhost:3000/auth/callback", {
      headers: {
        "x-forwarded-host": "judgetcg.com.br",
        "x-forwarded-proto": "https",
      },
    });
    expect(getRequestOrigin(req)).toBe("https://judgetcg.com.br");
  });

  it("isLocalhostUrl detecta localhost", () => {
    expect(isLocalhostUrl("http://localhost:3000")).toBe(true);
    expect(isLocalhostUrl("https://judgetcg.com.br")).toBe(false);
  });
});
