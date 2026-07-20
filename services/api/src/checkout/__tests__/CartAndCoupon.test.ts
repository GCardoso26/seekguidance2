import { describe, expect, it } from "vitest";
import { CartAggregate } from "../domain/CartAggregate.js";
import { createCouponEngine, type CouponDefinition } from "../domain/CouponEngine.js";
import {
  createCheckoutValidationPipeline,
  ValidatePayment,
  ValidateSeller,
} from "../application/CheckoutValidationPipeline.js";
import type { ListingPublicDTO } from "../../marketplace/public.js";

describe("CartAggregate", () => {
  it("AddItem / UpdateQuantity / RemoveItem", () => {
    const cart = CartAggregate.create("buyer-1");
    cart.addItem({
      listingId: "L1",
      quantity: 1,
      priceSnapshotCents: 1000,
      sellerId: "S1",
    });
    cart.addItem({ listingId: "L1", quantity: 2, priceSnapshotCents: 1100 });
    expect(cart.items[0]!.quantity).toBe(3);
    expect(cart.items[0]!.priceSnapshotCents).toBe(1100);

    cart.updateQuantity("L1", 1);
    expect(cart.items[0]!.quantity).toBe(1);

    cart.updateQuantity("L1", 0);
    expect(cart.items).toHaveLength(0);
  });

  it("MergeGuestCart e MergeUserCart", () => {
    const user = CartAggregate.create("buyer-1");
    user.addItem({ listingId: "A", quantity: 1, priceSnapshotCents: 100 });

    const guest = CartAggregate.create("guest:tok", { guestToken: "tok" });
    guest.addItem({ listingId: "A", quantity: 2, priceSnapshotCents: 100 });
    guest.addItem({ listingId: "B", quantity: 1, priceSnapshotCents: 200 });

    user.mergeGuestCart(guest);
    expect(user.items.find((i) => i.listingId === "A")!.quantity).toBe(3);
    expect(user.items.find((i) => i.listingId === "B")!.quantity).toBe(1);

    const other = CartAggregate.create("buyer-1");
    other.addItem({ listingId: "C", quantity: 1, priceSnapshotCents: 50 });
    user.mergeUserCart(other);
    expect(user.items.some((i) => i.listingId === "C")).toBe(true);
  });

  it("ValidateItems", () => {
    const cart = CartAggregate.create("buyer-1");
    cart.addItem({ listingId: "L1", quantity: 5, priceSnapshotCents: 100 });
    const result = cart.validateItems(
      new Map([
        [
          "L1",
          {
            listingId: "L1",
            status: "active",
            quantityAvailable: 2,
            priceCents: 100,
            active: true,
          },
        ],
      ]),
    );
    expect(result.ok).toBe(false);
    expect(result.issues[0]!.code).toBe("listing_insufficient_qty");
  });
});

describe("CouponEngine rules", () => {
  const base = (over: Partial<CouponDefinition> = {}): CouponDefinition => ({
    code: "TEST",
    percentOff: 10,
    amountOffCents: null,
    active: true,
    kind: "percentage",
    scope: "marketplace",
    sellerId: null,
    minSubtotalCents: null,
    maxUses: null,
    usedCount: 0,
    expiresAt: null,
    freeShipping: false,
    gameSlugs: [],
    categoryIds: [],
    ...over,
  });

  it("Percentage + Expiration + MinimumValue", () => {
    const engine = createCouponEngine();
    const ok = engine.apply(base(), { subtotalCents: 1000, sellerIds: [] });
    expect(ok.discountCents).toBe(100);
    expect(ok.totalCents).toBe(900);

    const expired = engine.apply(base({ expiresAt: new Date("2020-01-01") }), {
      subtotalCents: 1000,
      sellerIds: [],
      now: new Date("2026-01-01"),
    });
    expect(expired.ok).toBe(false);
    expect(expired.code).toBe("coupon_expired");

    const min = engine.apply(base({ minSubtotalCents: 2000 }), {
      subtotalCents: 1000,
      sellerIds: [],
    });
    expect(min.ok).toBe(false);
    expect(min.code).toBe("coupon_min_value");
  });

  it("SellerCoupon + FreeShipping", () => {
    const engine = createCouponEngine();
    const sellerFail = engine.apply(
      base({
        kind: "free_shipping",
        scope: "seller",
        sellerId: "S1",
        percentOff: null,
        freeShipping: true,
      }),
      { subtotalCents: 500, sellerIds: ["S2"] },
    );
    expect(sellerFail.ok).toBe(false);

    const ship = engine.apply(
      base({
        kind: "free_shipping",
        scope: "seller",
        sellerId: "S1",
        percentOff: null,
        freeShipping: true,
      }),
      { subtotalCents: 500, sellerIds: ["S1"] },
    );
    expect(ship.ok).toBe(true);
    expect(ship.freeShipping).toBe(true);
  });
});

describe("CheckoutValidationPipeline", () => {
  it("ValidateSeller → fail fast", async () => {
    const cart = CartAggregate.create("b1");
    cart.addItem({ listingId: "L1", quantity: 1, priceSnapshotCents: 100 });
    const pipeline = createCheckoutValidationPipeline([
      new ValidateSeller(),
      new ValidatePayment(),
    ]);
    const listing: ListingPublicDTO = {
      id: "L1",
      sellerId: "",
      subjectType: "product_variant",
      productVariantId: null,
      catalogVariantId: null,
      priceCents: 100,
      currency: "BRL",
      condition: "NM",
      quantity: 1,
      status: "active",
      inventoryStockUnitId: "su1",
    };
    // empty sellerId treated as missing by ValidateSeller — use nullish
    const bad = { ...listing, sellerId: "" };
    const result = await pipeline.run({
      cart,
      listings: new Map([["L1", bad]]),
      coupon: null,
      paymentReady: true,
    });
    // sellerId "" is truthy for optional chaining listing?.sellerId — empty string is falsy in JS!
    expect(result.ok).toBe(false);
    expect(result.issues[0]!.validator).toBe("ValidateSeller");
  });
});
