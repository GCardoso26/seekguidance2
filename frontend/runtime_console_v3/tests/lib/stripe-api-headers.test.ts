import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/proxy-auth", () => ({
  resolveSupabaseProxyAuth: vi.fn(),
}));

import { resolveSupabaseProxyAuth } from "@/lib/supabase/proxy-auth";
import { stripeApiHeaders } from "@/lib/stripe/stripe-api-headers";

const mockResolve = vi.mocked(resolveSupabaseProxyAuth);

describe("stripeApiHeaders", () => {
  beforeEach(() => {
    mockResolve.mockReset();
  });

  it("inclui X-Judge-User-Id e Authorization quando há sessão", async () => {
    mockResolve.mockResolvedValue({
      userId: "user-abc",
      accessToken: "jwt-xyz",
    });

    const headers = await stripeApiHeaders();

    expect(headers["X-Judge-User-Id"]).toBe("user-abc");
    expect(headers.Authorization).toBe("Bearer jwt-xyz");
  });

  it("prefere userId explícito quando informado", async () => {
    mockResolve.mockResolvedValue({
      userId: "from-cookie",
      accessToken: "jwt-xyz",
    });

    const headers = await stripeApiHeaders("explicit-id");

    expect(headers["X-Judge-User-Id"]).toBe("explicit-id");
    expect(headers.Authorization).toBe("Bearer jwt-xyz");
  });
});
