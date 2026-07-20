import type { CartAggregate } from "../domain/CartAggregate.js";
import type { CouponDefinition } from "../domain/CouponEngine.js";
import { createCouponEngine } from "../domain/CouponEngine.js";
import type { ListingPublicDTO } from "../../marketplace/public.js";

export interface CheckoutValidationContext {
  cart: CartAggregate;
  listings: Map<string, ListingPublicDTO>;
  coupon: CouponDefinition | null;
  paymentReady: boolean;
  gameSlugs?: string[];
  categoryIds?: string[];
}

export interface ValidationIssue {
  validator: string;
  code: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
}

export interface CheckoutValidator {
  readonly name: string;
  validate(ctx: CheckoutValidationContext): Promise<ValidationResult> | ValidationResult;
}

export class ValidateSeller implements CheckoutValidator {
  readonly name = "ValidateSeller";
  validate(ctx: CheckoutValidationContext): ValidationResult {
    const issues: ValidationIssue[] = [];
    for (const item of ctx.cart.items) {
      const listing = ctx.listings.get(item.listingId);
      if (!listing?.sellerId) {
        issues.push({
          validator: this.name,
          code: "seller_missing",
          message: `No seller for listing ${item.listingId}`,
        });
      }
    }
    return { ok: issues.length === 0, issues };
  }
}

export class ValidateInventory implements CheckoutValidator {
  readonly name = "ValidateInventory";
  validate(ctx: CheckoutValidationContext): ValidationResult {
    const issues: ValidationIssue[] = [];
    for (const item of ctx.cart.items) {
      const listing = ctx.listings.get(item.listingId);
      if (!listing) {
        issues.push({
          validator: this.name,
          code: "listing_not_found",
          message: item.listingId,
        });
        continue;
      }
      if (!listing.inventoryStockUnitId && !item.stockUnitId) {
        issues.push({
          validator: this.name,
          code: "stock_unit_missing",
          message: item.listingId,
        });
      }
      if (listing.quantity < item.quantity) {
        issues.push({
          validator: this.name,
          code: "insufficient_stock",
          message: item.listingId,
        });
      }
    }
    return { ok: issues.length === 0, issues };
  }
}

export class ValidateCoupon implements CheckoutValidator {
  readonly name = "ValidateCoupon";
  private readonly engine = createCouponEngine();

  validate(ctx: CheckoutValidationContext): ValidationResult {
    if (!ctx.coupon) return { ok: true, issues: [] };
    const sellerIds = [
      ...new Set(
        [...ctx.cart.items]
          .map((i) => i.sellerId)
          .filter((s): s is string => Boolean(s)),
      ),
    ];
    const result = this.engine.apply(ctx.coupon, {
      subtotalCents: ctx.cart.subtotalCents(),
      sellerIds,
      gameSlugs: ctx.gameSlugs,
      categoryIds: ctx.categoryIds,
    });
    if (!result.ok) {
      return {
        ok: false,
        issues: [
          {
            validator: this.name,
            code: result.code ?? "coupon_invalid",
            message: result.message ?? "Coupon rejected",
          },
        ],
      };
    }
    return { ok: true, issues: [] };
  }
}

export class ValidatePrices implements CheckoutValidator {
  readonly name = "ValidatePrices";
  validate(ctx: CheckoutValidationContext): ValidationResult {
    const issues: ValidationIssue[] = [];
    for (const item of ctx.cart.items) {
      if (item.priceSnapshotCents < 0) {
        issues.push({
          validator: this.name,
          code: "price_invalid",
          message: item.listingId,
        });
      }
      const listing = ctx.listings.get(item.listingId);
      if (listing && listing.priceCents <= 0) {
        issues.push({
          validator: this.name,
          code: "listing_price_invalid",
          message: item.listingId,
        });
      }
    }
    if (ctx.cart.subtotalCents() <= 0 && ctx.cart.items.length > 0) {
      issues.push({
        validator: this.name,
        code: "subtotal_invalid",
        message: "Subtotal must be positive",
      });
    }
    return { ok: issues.length === 0, issues };
  }
}

export class ValidatePayment implements CheckoutValidator {
  readonly name = "ValidatePayment";
  validate(ctx: CheckoutValidationContext): ValidationResult {
    if (!ctx.paymentReady) {
      return {
        ok: false,
        issues: [
          {
            validator: this.name,
            code: "payment_not_ready",
            message: "Payment gateway not ready",
          },
        ],
      };
    }
    return { ok: true, issues: [] };
  }
}

/**
 * Independent validators composed into a pipeline.
 * CreateSession is owned by application service after pipeline succeeds.
 */
export class CheckoutValidationPipeline {
  constructor(
    private readonly validators: CheckoutValidator[] = [
      new ValidateSeller(),
      new ValidateInventory(),
      new ValidateCoupon(),
      new ValidatePrices(),
      new ValidatePayment(),
    ],
  ) {}

  async run(ctx: CheckoutValidationContext): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    for (const v of this.validators) {
      const result = await v.validate(ctx);
      issues.push(...result.issues);
      if (!result.ok) {
        // fail-fast per step but collect? epic shows pipeline — fail fast is clearer
        return { ok: false, issues };
      }
    }
    return { ok: true, issues: [] };
  }
}

export function createCheckoutValidationPipeline(
  validators?: CheckoutValidator[],
): CheckoutValidationPipeline {
  return new CheckoutValidationPipeline(validators);
}
