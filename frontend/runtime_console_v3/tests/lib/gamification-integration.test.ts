import { describe, expect, it } from "vitest";
import { XP_REWARDS } from "@/lib/gamification";
import type { XpAction } from "@/types/gamification-profile";

const INTEGRATION_ACTIONS: Array<{ hook: string; action: XpAction }> = [
  { hook: "checkout_success", action: "marketplace_purchase" },
  { hook: "usePdvSale", action: "seller_sale" },
  { hook: "useTournamentRegistration", action: "tournament_registration" },
  { hook: "useSimulatePriceDrop", action: "price_alert_triggered" },
];

describe("gamification integration actions", () => {
  it("checkout concede 10 XP", () => {
    expect(XP_REWARDS.marketplace_purchase).toBe(10);
  });

  it("PDV concede 20 XP", () => {
    expect(XP_REWARDS.seller_sale).toBe(20);
  });

  it("torneio concede 15 XP", () => {
    expect(XP_REWARDS.tournament_registration).toBe(15);
  });

  it("alerta de preço concede 5 XP", () => {
    expect(XP_REWARDS.price_alert_triggered).toBe(5);
  });

  it("mapeia hooks para ações válidas de XP", () => {
    for (const { action } of INTEGRATION_ACTIONS) {
      expect(XP_REWARDS[action]).toBeGreaterThan(0);
    }
  });
});
