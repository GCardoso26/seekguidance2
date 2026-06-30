import { describe, expect, it } from "vitest";
import {
  computeUnlockedBadgeIds,
  isBadgeUnlocked,
  type BadgeUnlockStats,
} from "@/lib/badges";
import {
  awardXpEstimate,
  levelFromTotalXp,
  totalXpForLevel,
  XP_REWARDS,
  xpProgress,
} from "@/lib/gamification";

describe("totalXpForLevel", () => {
  it("nível 1 começa em 0 XP", () => {
    expect(totalXpForLevel(1)).toBe(0);
  });

  it("nível 2 requer XP escalado (~800)", () => {
    const xp = totalXpForLevel(2);
    expect(xp).toBeGreaterThanOrEqual(750);
    expect(xp).toBeLessThanOrEqual(850);
  });

  it("nível 50 aproxima 100.000 XP", () => {
    expect(totalXpForLevel(50)).toBe(100_000);
  });
});

describe("levelFromTotalXp", () => {
  it("0 XP = nível 1", () => {
    expect(levelFromTotalXp(0)).toBe(1);
  });

  it("850 XP = nível 2 (estado mock padrão)", () => {
    expect(levelFromTotalXp(850)).toBe(2);
  });

  it("100.000 XP = nível máximo 50", () => {
    expect(levelFromTotalXp(100_000)).toBe(50);
  });
});

describe("xpProgress", () => {
  it("calcula percentual entre níveis", () => {
    const p = xpProgress(900);
    expect(p.current_level).toBe(2);
    expect(p.progress_percent).toBeGreaterThan(0);
    expect(p.xp_to_next).toBeGreaterThan(0);
  });
});

describe("XP_REWARDS", () => {
  it("compra concede 10 XP", () => {
    expect(XP_REWARDS.marketplace_purchase).toBe(10);
  });

  it("venda concede 20 XP", () => {
    expect(XP_REWARDS.seller_sale).toBe(20);
  });

  it("estimativa de ganho soma corretamente", () => {
    expect(awardXpEstimate(100, "marketplace_purchase")).toBe(110);
    expect(awardXpEstimate(100, "tournament_registration")).toBe(115);
  });
});

describe("badge unlock", () => {
  const base: BadgeUnlockStats = {
    purchases: 0,
    sales: 0,
    tournaments: 0,
    price_alerts: 0,
    reviews: 0,
    rulings: 0,
    community_answers: 0,
    tournament_wins: 0,
    fast_shipping_rate: 0,
  };

  it("desbloqueia primeira compra com 1 purchase", () => {
    expect(isBadgeUnlocked("first_purchase", { ...base, purchases: 1 })).toBe(true);
    expect(isBadgeUnlocked("first_purchase", base)).toBe(false);
  });

  it("desbloqueia comprador fiel com 10 compras", () => {
    const ids = computeUnlockedBadgeIds({ ...base, purchases: 10 });
    expect(ids).toContain("first_purchase");
    expect(ids).toContain("loyal_buyer");
  });

  it("desbloqueia caçador de pechinchas com 5 alertas", () => {
    expect(isBadgeUnlocked("deal_hunter", { ...base, price_alerts: 5 })).toBe(true);
  });
});
