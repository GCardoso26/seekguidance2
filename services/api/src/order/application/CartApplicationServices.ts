import { createDomainEvent } from "../../shared/events/types.js";
import type { OutboxRepository } from "../../platform/outbox/types.js";
import type { TransactionManager } from "../../platform/transaction/types.js";
import type { CartRepository } from "../domain/CartRepository.js";
import type { AddCartItemInput } from "../domain/CartRepository.js";
import type { Cart } from "../domain/models.js";

export class CreateCartApplicationService {
  constructor(
    private readonly tx: TransactionManager,
    private readonly carts: CartRepository,
    private readonly outbox: OutboxRepository,
  ) {}

  async execute(input: {
    requestId: string;
    buyerId: string;
  }): Promise<Cart> {
    return this.tx.runInTransaction(async (txCtx) => {
      const existing = await this.carts.findOpenByBuyer(txCtx, input.buyerId);
      if (existing) return existing;

      const cart = await this.carts.create(txCtx, { buyerId: input.buyerId });
      await this.outbox.insert(txCtx, {
        event: createDomainEvent(
          "CartCreated",
          cart.id,
          { buyerId: cart.buyerId },
          {
            requestId: input.requestId,
            aggregateType: "cart",
            producer: "CreateCartApplicationService",
          },
        ),
      });
      return cart;
    });
  }
}

export class AddCartItemApplicationService {
  constructor(
    private readonly tx: TransactionManager,
    private readonly carts: CartRepository,
    private readonly outbox: OutboxRepository,
  ) {}

  async execute(input: {
    requestId: string;
    cartId: string;
    item: AddCartItemInput;
  }): Promise<Cart> {
    // priceSnapshot is mandatory — never fetch Listing here.
    if (input.item.priceSnapshotCents < 0) throw new Error("price_snapshot_required");

    return this.tx.runInTransaction(async (txCtx) => {
      const cart = await this.carts.addItem(txCtx, input.cartId, {
        listingId: input.item.listingId,
        catalogVariantId: input.item.catalogVariantId,
        quantity: input.item.quantity,
        priceSnapshotCents: input.item.priceSnapshotCents,
        currency: input.item.currency ?? "BRL",
      });
      await this.outbox.insert(txCtx, {
        event: createDomainEvent(
          "CartItemAdded",
          cart.id,
          {
            listingId: input.item.listingId,
            quantity: input.item.quantity,
            priceSnapshotCents: input.item.priceSnapshotCents,
          },
          {
            requestId: input.requestId,
            aggregateType: "cart",
            producer: "AddCartItemApplicationService",
          },
        ),
      });
      return cart;
    });
  }
}

export class RemoveCartItemApplicationService {
  constructor(
    private readonly tx: TransactionManager,
    private readonly carts: CartRepository,
  ) {}

  execute(cartId: string, itemId: string): Promise<Cart> {
    return this.tx.runInTransaction((txCtx) => this.carts.removeItem(txCtx, cartId, itemId));
  }
}
