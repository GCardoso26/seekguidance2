/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSubscription, useCheckout, useCustomerPortal } from "@/hooks/useSubscription";

vi.mock("@/features/auth/AuthProvider", () => ({
  useJudgeAuth: vi.fn(),
}));

vi.mock("@/lib/analytics", () => ({
  trackEvent: vi.fn(),
}));

vi.mock("@/lib/stripe/prices", () => ({
  stripePriceId: vi.fn(() => "price_test_monthly"),
  tierToStripe: vi.fn((plan: string) => (plan === "team" ? "team" : "spike")),
}));

import { useJudgeAuth } from "@/features/auth/AuthProvider";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("useSubscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("retorna free quando não há utilizador autenticado", () => {
    vi.mocked(useJudgeAuth).mockReturnValue({
      user: null,
      session: null,
      loading: false,
      configured: true,
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
    });

    const { result } = renderHook(() => useSubscription(), { wrapper: createWrapper() });
    expect(result.current.tier).toBe("free");
    expect(result.current.isPro).toBe(false);
  });

  it("retorna tier pro para subscrição spike", async () => {
    vi.mocked(useJudgeAuth).mockReturnValue({
      user: { id: "u1" } as never,
      session: null,
      loading: false,
      configured: true,
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
    });
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        tier: "pro",
        status: "active",
        features: { advanced_analytics: true, deck_export: true },
      }),
    } as Response);

    const { result } = renderHook(() => useSubscription(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.tier).toBe("pro");
      expect(result.current.isPro).toBe(true);
      expect(result.current.features.advanced_analytics).toBe(true);
    });
  });

  it("retorna tier team", async () => {
    vi.mocked(useJudgeAuth).mockReturnValue({
      user: { id: "u2" } as never,
      session: null,
      loading: false,
      configured: true,
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
    });
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        tier: "team",
        status: "active",
        features: { team_management: true, api_access: true },
      }),
    } as Response);

    const { result } = renderHook(() => useSubscription(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isTeam).toBe(true);
    });
  });
});

describe("useCheckout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("cria sessão de checkout com sucesso", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ session_id: "cs_test", url: "https://checkout.stripe.com/test" }),
    } as Response);

    const { result } = renderHook(() => useCheckout(), { wrapper: createWrapper() });

    const data = await result.current.mutateAsync({
      plan: "pro",
      billingCycle: "monthly",
    });

    expect(data.url).toContain("checkout.stripe.com");
    expect(fetch).toHaveBeenCalledWith(
      "/api/stripe/checkout",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("falha quando API retorna erro", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: "Stripe indisponível" }),
    } as Response);

    const { result } = renderHook(() => useCheckout(), { wrapper: createWrapper() });

    await expect(
      result.current.mutateAsync({ plan: "pro", billingCycle: "monthly" }),
    ).rejects.toThrow("Stripe indisponível");
  });
});

describe("useCustomerPortal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("abre portal de faturação", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: "https://billing.stripe.com/test" }),
    } as Response);

    const { result } = renderHook(() => useCustomerPortal(), { wrapper: createWrapper() });
    const data = await result.current.mutateAsync();
    expect(data.url).toContain("billing.stripe.com");
  });
});
