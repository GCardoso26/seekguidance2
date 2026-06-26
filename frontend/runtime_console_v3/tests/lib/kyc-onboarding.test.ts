import { describe, expect, it } from "vitest";
import { isKycAwaitingReview, needsOnboardingContinue } from "@/lib/kyc-onboarding";

describe("needsOnboardingContinue", () => {
  it("oculta ação quando documentação está em análise", () => {
    expect(
      needsOnboardingContinue("pending", "em verificação: individual.verification.document"),
    ).toBe(false);
    expect(needsOnboardingContinue("pending", "Aguardando verificação Stripe")).toBe(false);
  });

  it("mantém ação quando há pendências no Stripe", () => {
    expect(needsOnboardingContinue("pending", "pendências: individual.id_number")).toBe(true);
    expect(needsOnboardingContinue("restricted", "requirements.past_due")).toBe(true);
  });

  it("libera quando verificado", () => {
    expect(needsOnboardingContinue("verified", null)).toBe(false);
  });
});

describe("isKycAwaitingReview", () => {
  it("detecta pending em análise", () => {
    expect(isKycAwaitingReview("pending", "Aguardando verificação Stripe")).toBe(true);
    expect(isKycAwaitingReview("pending", "pendências: foo")).toBe(false);
  });
});
