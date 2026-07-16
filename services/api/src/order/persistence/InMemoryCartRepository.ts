import type { TxParticipant } from "../../platform/transaction/InMemoryTransactionManager.js";
import type { TxContext } from "../../platform/transaction/types.js";
import { getClock } from "../../shared/time/Clock.js";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import type { CartRepository, CreateCartInput } from "../domain/CartRepository.js";
import type { Cart, CartItem } from "../domain/models.js";

export class InMemoryCartRepository implements CartRepository, TxParticipant {
  private rows = new Map<string, Cart>();
  private snapshots = new Map<string, Map<string, Cart>>();

  beginTx(txId: string): void {
    this.snapshots.set(txId, cloneMap(this.rows));
  }
  commitTx(txId: string): void {
    this.snapshots.delete(txId);
  }
  rollbackTx(txId: string): void {
    const snap = this.snapshots.get(txId);
    if (snap) this.rows = snap;
    this.snapshots.delete(txId);
  }

  async create(_tx: TxContext, input: CreateCartInput): Promise<Cart> {
    const now = getClock().now();
    const cart: Cart = {
      id: input.id ?? getIdGenerator().generate(),
      buyerId: input.buyerId,
      status: "open",
      items: [],
      rowVersion: 1,
      createdAt: now,
      updatedAt: now,
    };
    this.rows.set(cart.id, cart);
    return structuredClone(cart);
  }

  async findById(_tx: TxContext, id: string): Promise<Cart | null> {
    const row = this.rows.get(id);
    return row ? structuredClone(row) : null;
  }

  async findOpenByBuyer(_tx: TxContext, buyerId: string): Promise<Cart | null> {
    const row = [...this.rows.values()].find((c) => c.buyerId === buyerId && c.status === "open");
    return row ? structuredClone(row) : null;
  }

  async addItem(
    _tx: TxContext,
    cartId: string,
    item: Omit<CartItem, "id"> & { id?: string },
  ): Promise<Cart> {
    const cart = this.rows.get(cartId);
    if (!cart) throw new Error("cart_not_found");
    if (cart.status !== "open") throw new Error("cart_not_open");
    if (item.quantity <= 0) throw new Error("cart_item_quantity_invalid");
    if (item.priceSnapshotCents < 0) throw new Error("cart_item_price_invalid");

    const existing = cart.items.find((i) => i.listingId === item.listingId);
    if (existing) {
      existing.quantity += item.quantity;
      // Keep original snapshot — price frozen at first add.
    } else {
      cart.items.push({
        id: item.id ?? getIdGenerator().generate(),
        listingId: item.listingId,
        catalogVariantId: item.catalogVariantId,
        quantity: item.quantity,
        priceSnapshotCents: item.priceSnapshotCents,
        currency: item.currency ?? "BRL",
      });
    }
    cart.rowVersion += 1;
    cart.updatedAt = getClock().now();
    this.rows.set(cartId, cart);
    return structuredClone(cart);
  }

  async removeItem(_tx: TxContext, cartId: string, itemId: string): Promise<Cart> {
    const cart = this.rows.get(cartId);
    if (!cart) throw new Error("cart_not_found");
    if (cart.status !== "open") throw new Error("cart_not_open");
    cart.items = cart.items.filter((i) => i.id !== itemId);
    cart.rowVersion += 1;
    cart.updatedAt = getClock().now();
    this.rows.set(cartId, cart);
    return structuredClone(cart);
  }

  async markCheckedOut(
    _tx: TxContext,
    cartId: string,
    expectedVersion?: number,
  ): Promise<Cart> {
    const cart = this.rows.get(cartId);
    if (!cart) throw new Error("cart_not_found");
    if (expectedVersion != null && cart.rowVersion !== expectedVersion) {
      throw new Error(`optimistic_lock_failed:cart:${cartId}`);
    }
    cart.status = "checked_out";
    cart.rowVersion += 1;
    cart.updatedAt = getClock().now();
    this.rows.set(cartId, cart);
    return structuredClone(cart);
  }
}

function cloneMap(src: Map<string, Cart>): Map<string, Cart> {
  const out = new Map<string, Cart>();
  for (const [k, v] of src) out.set(k, structuredClone(v));
  return out;
}
