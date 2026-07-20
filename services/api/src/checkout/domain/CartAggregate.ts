import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import type { Cart, CartItem, CartStatus } from "./types.js";
import { cartSubtotalCents } from "./types.js";

export interface AddItemInput {
  listingId: string;
  quantity: number;
  priceSnapshotCents: number;
  currency?: string;
  productVariantId?: string | null;
  catalogVariantId?: string | null;
  sellerId?: string | null;
  stockUnitId?: string | null;
}

export interface ListingValidationView {
  listingId: string;
  status: string;
  quantityAvailable: number;
  priceCents: number;
  active: boolean;
}

export interface CartValidationIssue {
  listingId: string;
  code: string;
  message: string;
}

export interface CartValidationResult {
  ok: boolean;
  issues: CartValidationIssue[];
}

/**
 * Cart Aggregate — all mutations go through here; persistence stores snapshots.
 */
export class CartAggregate {
  private constructor(
    private state: Cart,
    private readonly guestToken: string | null = null,
  ) {}

  static create(buyerId: string, opts?: { guestToken?: string | null }): CartAggregate {
    const now = new Date();
    return new CartAggregate(
      {
        id: getIdGenerator().generate(),
        buyerId,
        status: "open",
        items: [],
        createdAt: now,
        updatedAt: now,
      },
      opts?.guestToken ?? null,
    );
  }

  static rehydrate(cart: Cart, guestToken: string | null = null): CartAggregate {
    return new CartAggregate({ ...cart, items: cart.items.map((i) => ({ ...i })) }, guestToken);
  }

  get id(): string {
    return this.state.id;
  }

  get buyerId(): string {
    return this.state.buyerId;
  }

  get status(): CartStatus {
    return this.state.status;
  }

  get items(): readonly CartItem[] {
    return this.state.items;
  }

  getGuestToken(): string | null {
    return this.guestToken;
  }

  snapshot(): Cart {
    return {
      ...this.state,
      items: this.state.items.map((i) => ({ ...i })),
    };
  }

  subtotalCents(): number {
    return cartSubtotalCents(this.state);
  }

  assertOpen(): void {
    if (this.state.status !== "open") throw new Error("cart_not_open");
  }

  addItem(input: AddItemInput): void {
    this.assertOpen();
    if (input.quantity <= 0) throw new Error("quantity_invalid");
    if (input.priceSnapshotCents < 0) throw new Error("price_invalid");

    const existing = this.state.items.find((i) => i.listingId === input.listingId);
    if (existing) {
      existing.quantity += input.quantity;
      existing.priceSnapshotCents = input.priceSnapshotCents;
      existing.productVariantId = input.productVariantId ?? existing.productVariantId;
      existing.catalogVariantId = input.catalogVariantId ?? existing.catalogVariantId;
      existing.sellerId = input.sellerId ?? existing.sellerId;
      existing.stockUnitId = input.stockUnitId ?? existing.stockUnitId;
    } else {
      this.state.items.push({
        id: getIdGenerator().generate(),
        cartId: this.state.id,
        listingId: input.listingId,
        productVariantId: input.productVariantId ?? null,
        catalogVariantId: input.catalogVariantId ?? null,
        sellerId: input.sellerId ?? null,
        stockUnitId: input.stockUnitId ?? null,
        quantity: input.quantity,
        priceSnapshotCents: input.priceSnapshotCents,
        currency: input.currency ?? "BRL",
      });
    }
    this.touch();
  }

  removeItem(listingId: string): void {
    this.assertOpen();
    const before = this.state.items.length;
    this.state.items = this.state.items.filter((i) => i.listingId !== listingId);
    if (this.state.items.length === before) throw new Error("cart_item_not_found");
    this.touch();
  }

  updateQuantity(listingId: string, quantity: number): void {
    this.assertOpen();
    if (quantity <= 0) {
      this.removeItem(listingId);
      return;
    }
    const item = this.state.items.find((i) => i.listingId === listingId);
    if (!item) throw new Error("cart_item_not_found");
    item.quantity = quantity;
    this.touch();
  }

  /**
   * MergeGuestCart — absorb guest items into this (user) cart; guest marked abandoned by app service.
   */
  mergeGuestCart(guest: CartAggregate): void {
    this.assertOpen();
    guest.assertOpen();
    for (const item of guest.items) {
      this.addItem({
        listingId: item.listingId,
        quantity: item.quantity,
        priceSnapshotCents: item.priceSnapshotCents,
        currency: item.currency,
        productVariantId: item.productVariantId,
        catalogVariantId: item.catalogVariantId,
        sellerId: item.sellerId,
        stockUnitId: item.stockUnitId,
      });
    }
    this.touch();
  }

  /**
   * MergeUserCart — merge source (same buyer) into this destination.
   */
  mergeUserCart(source: CartAggregate): void {
    this.assertOpen();
    source.assertOpen();
    if (source.buyerId !== this.buyerId) throw new Error("cart_merge_buyer_mismatch");
    if (source.id === this.id) throw new Error("cart_merge_same_cart");
    for (const item of source.items) {
      this.addItem({
        listingId: item.listingId,
        quantity: item.quantity,
        priceSnapshotCents: item.priceSnapshotCents,
        currency: item.currency,
        productVariantId: item.productVariantId,
        catalogVariantId: item.catalogVariantId,
        sellerId: item.sellerId,
        stockUnitId: item.stockUnitId,
      });
    }
    this.touch();
  }

  assignBuyer(buyerId: string): void {
    this.assertOpen();
    this.state.buyerId = buyerId;
    this.touch();
  }

  markCheckedOut(): void {
    this.assertOpen();
    if (this.state.items.length === 0) throw new Error("cart_empty");
    this.state.status = "checked_out";
    this.touch();
  }

  markAbandoned(): void {
    if (this.state.status === "checked_out") throw new Error("cart_already_checked_out");
    this.state.status = "abandoned";
    this.touch();
  }

  validateItems(listings: Map<string, ListingValidationView>): CartValidationResult {
    const issues: CartValidationIssue[] = [];
    if (this.state.items.length === 0) {
      issues.push({ listingId: "*", code: "cart_empty", message: "Cart has no items" });
      return { ok: false, issues };
    }
    for (const item of this.state.items) {
      const view = listings.get(item.listingId);
      if (!view) {
        issues.push({
          listingId: item.listingId,
          code: "listing_not_found",
          message: "Listing not found",
        });
        continue;
      }
      if (!view.active || view.status !== "active") {
        issues.push({
          listingId: item.listingId,
          code: "listing_not_active",
          message: "Listing is not active",
        });
      }
      if (view.quantityAvailable < item.quantity) {
        issues.push({
          listingId: item.listingId,
          code: "listing_insufficient_qty",
          message: `Need ${item.quantity}, available ${view.quantityAvailable}`,
        });
      }
    }
    return { ok: issues.length === 0, issues };
  }

  private touch(): void {
    this.state.updatedAt = new Date();
  }
}
