import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { buildAppRedirectUrl, buildOAuthCallbackUrl, getAppUrl } from "@/lib/app-url";

describe("app-url", () => {
  const originalEnv = process.env.NEXT_PUBLIC_APP_URL;

  beforeEach(() => {
    vi.stubGlobal("window", undefined);
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = originalEnv;
    vi.unstubAllGlobals();
  });

  it("prefere NEXT_PUBLIC_APP_URL", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://judgetcg.com.br";
    expect(getAppUrl()).toBe("https://judgetcg.com.br");
    expect(buildAppRedirectUrl("/judge")).toBe("https://judgetcg.com.br/judge");
    expect(buildOAuthCallbackUrl("/judge")).toBe(
      "https://judgetcg.com.br/auth/callback?next=%2Fjudge",
    );
  });

  it("usa fallbackOrigin quando env ausente", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    expect(buildAppRedirectUrl("/judge", "https://preview.vercel.app")).toBe(
      "https://preview.vercel.app/judge",
    );
  });
});
