/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { cleanup, fireEvent, render, within } from "@testing-library/react";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

function createLocalStorageMock() {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const key of Object.keys(store)) {
        delete store[key];
      }
    },
  };
}

describe("OnboardingFlow", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createLocalStorageMock());
  });

  afterEach(() => {
    cleanup();
  });

  it("mostra passo inicial", () => {
    const { container } = render(<OnboardingFlow />);
    expect(within(container).getByText("Bem-vindo ao Judge TCG!")).toBeTruthy();
  });

  it("avança para próximo passo", () => {
    const { container } = render(<OnboardingFlow />);
    fireEvent.click(within(container).getByTestId("onboarding-continue"));
    expect(within(container).getByText("Crie seu perfil")).toBeTruthy();
  });
});
