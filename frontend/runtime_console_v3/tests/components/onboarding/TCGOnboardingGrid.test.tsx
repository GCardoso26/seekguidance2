/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { TCGOnboardingGrid } from "@/components/onboarding/TCGOnboardingGrid";
import type { TcgType } from "@/types/judge";

vi.mock("@/features/auth/AuthProvider", () => ({
  useJudgeAuth: () => ({
    user: { id: "u1", email: "test@example.com", user_metadata: {} },
    loading: false,
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock("@/hooks/useCompleteOnboarding", () => ({
  completeOnboarding: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/components/premium/UpgradeModalProvider", () => ({
  useUpgradeModal: () => ({ showUpgrade: vi.fn() }),
}));

describe("TCGOnboardingGrid", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("desabilita confirmar até 5 TCGs", () => {
    const selected: TcgType[] = ["magic", "pokemon"];
    render(
      <TCGOnboardingGrid
        selected={selected}
        onChange={vi.fn()}
      />,
    );
    const btn = screen.getByRole("button", { name: /Confirmar/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(screen.getByText(/\/5 selecionados/)).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
  });

  it("mostra contador ao selecionar", () => {
    const ids: TcgType[] = ["magic", "pokemon", "yugioh", "lorcana", "one_piece"];
    render(<TCGOnboardingGrid selected={ids} onChange={vi.fn()} />);
    expect(screen.getByText(/\/5 selecionados/)).toBeTruthy();
    expect(screen.getByText("5")).toBeTruthy();
    const btn = screen.getByRole("button", { name: /Confirmar/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });
});
