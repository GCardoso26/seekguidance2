/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { sellerAnalyticsMock } from "@/lib/seller-analytics-mock";

const { useSellerAnalyticsMock } = vi.hoisted(() => ({
  useSellerAnalyticsMock: vi.fn(),
}));

vi.mock("@/hooks/useSellerAnalytics", () => ({
  useSellerAnalytics: useSellerAnalyticsMock,
}));

vi.mock("next/dynamic", () => ({
  default: () => {
    return function MockSparkline() {
      return <div data-testid="activity-sparkline" />;
    };
  },
}));

import { SellerAnalyticsPanel } from "@/components/seller-profile/SellerAnalyticsPanel";

describe("SellerAnalyticsPanel", () => {
  const originalFlag = process.env.NEXT_PUBLIC_FEATURE_SELLER_ANALYTICS;

  beforeEach(() => {
    cleanup();
    useSellerAnalyticsMock.mockReset();
    process.env.NEXT_PUBLIC_FEATURE_SELLER_ANALYTICS = "true";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_FEATURE_SELLER_ANALYTICS = originalFlag;
  });

  it("renderiza métricas com dados do mock", () => {
    useSellerAnalyticsMock.mockReturnValue({
      data: sellerAnalyticsMock("cardseekers"),
      isLoading: false,
      isError: false,
    });

    render(<SellerAnalyticsPanel username="cardseekers" />);

    expect(screen.getByTestId("seller-analytics-panel")).toBeTruthy();
    expect(screen.getByText("1.247")).toBeTruthy();
    expect(screen.getByText("4.8")).toBeTruthy();
    expect(screen.getByText("Entrega Rápida")).toBeTruthy();
  });

  it("mostra skeleton durante loading", () => {
    useSellerAnalyticsMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    const { container } = render(<SellerAnalyticsPanel username="cardseekers" />);
    expect(container.querySelector(".animate-pulse")).toBeTruthy();
    expect(screen.queryByTestId("seller-analytics-panel")).toBeNull();
  });

  it("não renderiza em erro de fetch", () => {
    useSellerAnalyticsMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    const { container } = render(<SellerAnalyticsPanel username="cardseekers" />);
    expect(container.firstChild).toBeNull();
  });

  it("respeita feature flag desligada", () => {
    process.env.NEXT_PUBLIC_FEATURE_SELLER_ANALYTICS = "false";
    useSellerAnalyticsMock.mockReturnValue({
      data: sellerAnalyticsMock("cardseekers"),
      isLoading: false,
      isError: false,
    });

    const { container } = render(<SellerAnalyticsPanel username="cardseekers" />);
    expect(container.firstChild).toBeNull();
  });

  it("exibe badges com dados padrão", () => {
    const mock = sellerAnalyticsMock("demo");
    useSellerAnalyticsMock.mockReturnValue({
      data: mock,
      isLoading: false,
      isError: false,
    });

    render(<SellerAnalyticsPanel username="demo" />);
    expect(screen.getByText(mock.badges[0].name)).toBeTruthy();
    expect(screen.getAllByTestId("activity-sparkline").length).toBeGreaterThan(0);
  });
});
