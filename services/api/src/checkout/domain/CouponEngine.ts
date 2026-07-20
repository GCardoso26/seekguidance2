import type { Coupon } from "./types.js";

export type CouponKind = "fixed" | "percentage" | "free_shipping";
export type CouponScope = "marketplace" | "seller";

export interface CouponDefinition extends Coupon {
  kind: CouponKind;
  scope: CouponScope;
  sellerId: string | null;
  minSubtotalCents: number | null;
  maxUses: number | null;
  usedCount: number;
  expiresAt: Date | null;
  freeShipping: boolean;
  gameSlugs: string[];
  categoryIds: string[];
}

export interface CouponEvalContext {
  now?: Date;
  subtotalCents: number;
  sellerIds: string[];
  gameSlugs?: string[];
  categoryIds?: string[];
}

export interface CouponRuleResult {
  ok: boolean;
  code?: string;
  message?: string;
  /** Extra discount from this rule (cents). Free shipping sets flag only. */
  discountCents?: number;
  freeShipping?: boolean;
}

export interface CouponRule {
  readonly name: string;
  evaluate(coupon: CouponDefinition, ctx: CouponEvalContext): CouponRuleResult;
}

export class ExpirationRule implements CouponRule {
  readonly name = "Expiration";
  evaluate(coupon: CouponDefinition, ctx: CouponEvalContext): CouponRuleResult {
    if (!coupon.expiresAt) return { ok: true };
    const now = ctx.now ?? new Date();
    if (coupon.expiresAt.getTime() < now.getTime()) {
      return { ok: false, code: "coupon_expired", message: "Coupon expired" };
    }
    return { ok: true };
  }
}

export class MaximumUsesRule implements CouponRule {
  readonly name = "MaximumUses";
  evaluate(coupon: CouponDefinition): CouponRuleResult {
    if (coupon.maxUses == null) return { ok: true };
    if (coupon.usedCount >= coupon.maxUses) {
      return { ok: false, code: "coupon_max_uses", message: "Coupon usage exhausted" };
    }
    return { ok: true };
  }
}

export class MinimumValueRule implements CouponRule {
  readonly name = "MinimumValue";
  evaluate(coupon: CouponDefinition, ctx: CouponEvalContext): CouponRuleResult {
    if (coupon.minSubtotalCents == null) return { ok: true };
    if (ctx.subtotalCents < coupon.minSubtotalCents) {
      return {
        ok: false,
        code: "coupon_min_value",
        message: `Minimum subtotal ${coupon.minSubtotalCents}`,
      };
    }
    return { ok: true };
  }
}

export class MarketplaceCouponRule implements CouponRule {
  readonly name = "MarketplaceCoupon";
  evaluate(coupon: CouponDefinition): CouponRuleResult {
    if (coupon.scope === "marketplace") return { ok: true };
    return { ok: true }; // seller scope handled by SellerCouponRule
  }
}

export class SellerCouponRule implements CouponRule {
  readonly name = "SellerCoupon";
  evaluate(coupon: CouponDefinition, ctx: CouponEvalContext): CouponRuleResult {
    if (coupon.scope !== "seller") return { ok: true };
    if (!coupon.sellerId) {
      return { ok: false, code: "coupon_seller_missing", message: "Seller coupon misconfigured" };
    }
    if (!ctx.sellerIds.includes(coupon.sellerId)) {
      return {
        ok: false,
        code: "coupon_seller_mismatch",
        message: "Cart has no items from coupon seller",
      };
    }
    return { ok: true };
  }
}

export class GameRestrictionRule implements CouponRule {
  readonly name = "GameRestriction";
  evaluate(coupon: CouponDefinition, ctx: CouponEvalContext): CouponRuleResult {
    if (!coupon.gameSlugs.length) return { ok: true };
    const games = ctx.gameSlugs ?? [];
    if (!games.length) {
      return { ok: false, code: "coupon_game_unknown", message: "Cart games unknown for restriction" };
    }
    const ok = games.some((g) => coupon.gameSlugs.includes(g));
    return ok
      ? { ok: true }
      : { ok: false, code: "coupon_game_restriction", message: "Game not eligible" };
  }
}

export class CategoryRestrictionRule implements CouponRule {
  readonly name = "CategoryRestriction";
  evaluate(coupon: CouponDefinition, ctx: CouponEvalContext): CouponRuleResult {
    if (!coupon.categoryIds.length) return { ok: true };
    const cats = ctx.categoryIds ?? [];
    if (!cats.length) {
      return {
        ok: false,
        code: "coupon_category_unknown",
        message: "Cart categories unknown for restriction",
      };
    }
    const ok = cats.some((c) => coupon.categoryIds.includes(c));
    return ok
      ? { ok: true }
      : { ok: false, code: "coupon_category_restriction", message: "Category not eligible" };
  }
}

export class FixedAmountRule implements CouponRule {
  readonly name = "Fixed";
  evaluate(coupon: CouponDefinition, ctx: CouponEvalContext): CouponRuleResult {
    if (coupon.kind !== "fixed" && coupon.amountOffCents == null) return { ok: true };
    if (coupon.kind === "percentage") return { ok: true };
    if (coupon.kind === "free_shipping") return { ok: true };
    const amount = coupon.amountOffCents ?? 0;
    if (amount <= 0) return { ok: true };
    return {
      ok: true,
      discountCents: Math.min(amount, ctx.subtotalCents),
    };
  }
}

export class PercentageRule implements CouponRule {
  readonly name = "Percentage";
  evaluate(coupon: CouponDefinition, ctx: CouponEvalContext): CouponRuleResult {
    if (coupon.kind !== "percentage" && coupon.percentOff == null) return { ok: true };
    if (coupon.kind === "fixed" || coupon.kind === "free_shipping") return { ok: true };
    const pct = coupon.percentOff ?? 0;
    if (pct <= 0) return { ok: true };
    return {
      ok: true,
      discountCents: Math.floor((ctx.subtotalCents * pct) / 100),
    };
  }
}

export class FreeShippingRule implements CouponRule {
  readonly name = "FreeShipping";
  evaluate(coupon: CouponDefinition): CouponRuleResult {
    if (coupon.kind === "free_shipping" || coupon.freeShipping) {
      return { ok: true, freeShipping: true, discountCents: 0 };
    }
    return { ok: true };
  }
}

export interface CouponApplicationResult {
  ok: boolean;
  code?: string;
  message?: string;
  discountCents: number;
  freeShipping: boolean;
  totalCents: number;
  appliedRules: string[];
}

/**
 * Coupon Engine — composes independent Rules. No gateway/checkout coupling.
 */
export class CouponEngine {
  constructor(private readonly rules: CouponRule[] = defaultCouponRules()) {}

  apply(coupon: CouponDefinition | null, ctx: CouponEvalContext): CouponApplicationResult {
    if (!coupon || !coupon.active) {
      return {
        ok: true,
        discountCents: 0,
        freeShipping: false,
        totalCents: ctx.subtotalCents,
        appliedRules: [],
      };
    }

    let discountCents = 0;
    let freeShipping = false;
    const appliedRules: string[] = [];

    for (const rule of this.rules) {
      const result = rule.evaluate(coupon, ctx);
      if (!result.ok) {
        return {
          ok: false,
          code: result.code,
          message: result.message,
          discountCents: 0,
          freeShipping: false,
          totalCents: ctx.subtotalCents,
          appliedRules,
        };
      }
      if (result.discountCents != null && result.discountCents > 0) {
        discountCents += result.discountCents;
        appliedRules.push(rule.name);
      }
      if (result.freeShipping) {
        freeShipping = true;
        appliedRules.push(rule.name);
      }
    }

    discountCents = Math.min(discountCents, ctx.subtotalCents);
    return {
      ok: true,
      discountCents,
      freeShipping,
      totalCents: Math.max(0, ctx.subtotalCents - discountCents),
      appliedRules,
    };
  }
}

export function defaultCouponRules(): CouponRule[] {
  return [
    new ExpirationRule(),
    new MaximumUsesRule(),
    new MinimumValueRule(),
    new MarketplaceCouponRule(),
    new SellerCouponRule(),
    new GameRestrictionRule(),
    new CategoryRestrictionRule(),
    new FixedAmountRule(),
    new PercentageRule(),
    new FreeShippingRule(),
  ];
}

export function createCouponEngine(rules?: CouponRule[]): CouponEngine {
  return new CouponEngine(rules ?? defaultCouponRules());
}

/** @deprecated prefer CouponEngine — kept for saga compatibility */
export function applyCouponDiscount(
  subtotalCents: number,
  coupon: Coupon | null,
): { discountCents: number; totalCents: number } {
  if (!coupon) {
    return { discountCents: 0, totalCents: subtotalCents };
  }
  const def: CouponDefinition = {
    ...coupon,
    kind: coupon.percentOff != null ? "percentage" : "fixed",
    scope: "marketplace",
    sellerId: null,
    minSubtotalCents: null,
    maxUses: null,
    usedCount: 0,
    expiresAt: null,
    freeShipping: false,
    gameSlugs: [],
    categoryIds: [],
  };
  const r = createCouponEngine().apply(def, { subtotalCents, sellerIds: [] });
  return { discountCents: r.discountCents, totalCents: r.totalCents };
}
