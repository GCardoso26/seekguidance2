/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { FeatureGate } from "@/components/premium/FeatureGate";
import { DEFAULT_FEATURES, type SubscriptionFeatures } from "@/lib/subscription/features";
import { useSubscription } from "@/hooks/useSubscription";

vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));

vi.mock("@/hooks/useSubscription", () => ({
  useSubscription: vi.fn(),
}));

const mockUseSubscription = vi.mocked(useSubscription);

function mockSub(partial: Partial<ReturnType<typeof useSubscription>>) {
  mockUseSubscription.mockReturnValue({
    tier: "free",
    status: "active",
    features: DEFAULT_FEATURES,
    isLoading: false,
    isPro: false,
    isTeam: false,
    ...partial,
  } as ReturnType<typeof useSubscription>);
}

describe("FeatureGate", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    mockUseSubscription.mockReset();
  });

  it("renderiza children quando o utilizador tem acesso", () => {
    mockSub({
      features: { ...DEFAULT_FEATURES, advanced_analytics: true } as SubscriptionFeatures,
    });

    render(
      <FeatureGate feature="advanced_analytics">
        <div data-testid="premium-content">Conteúdo PRO</div>
      </FeatureGate>,
    );

    expect(screen.getByTestId("premium-content")).toBeTruthy();
  });

  it("mostra paywall quando falta acesso", () => {
    mockSub({ features: DEFAULT_FEATURES });

    render(
      <FeatureGate feature="advanced_analytics">
        <div data-testid="premium-content">Conteúdo PRO</div>
      </FeatureGate>,
    );

    expect(screen.queryByTestId("premium-content")).toBeNull();
    expect(screen.getByText(/plano Spike ou Equipe/i)).toBeTruthy();
    expect(screen.getByText(/Fazer upgrade/i)).toBeTruthy();
  });

  it("renderiza fallback customizado", () => {
    mockSub({ features: DEFAULT_FEATURES });

    render(
      <FeatureGate feature="api_access" fallback={<div data-testid="custom-fallback">Custom</div>}>
        <div>Premium</div>
      </FeatureGate>,
    );

    expect(screen.getByTestId("custom-fallback")).toBeTruthy();
  });

  it("mostra estado de carregamento", () => {
    mockSub({ isLoading: true });

    render(
      <FeatureGate feature="advanced_analytics">
        <div>Premium</div>
      </FeatureGate>,
    );

    expect(screen.getByText(/verificar plano/i)).toBeTruthy();
  });
});
