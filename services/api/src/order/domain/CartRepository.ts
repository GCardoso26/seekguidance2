import type { TxContext } from "../../platform/transaction/types.js";
import type { Cart, CartItem } from "./models.js";

export interface CreateCartInput {
  id?: string;
  buyerId: string;
}

export interface AddCartItemInput {
  listingId: string;
  catalogVariantId: string;
  quantity: number;
  /** Required snapshot — caller must pass listing price at this moment. */
  priceSnapshotCents: number;
  currency?: "BRL";
}

export interface CartRepository {
  create(tx: TxContext, input: CreateCartInput): Promise<Cart>;
  findById(tx: TxContext, id: string): Promise<Cart | null>;
  findOpenByBuyer(tx: TxContext, buyerId: string): Promise<Cart | null>;
  addItem(tx: TxContext, cartId: string, item: Omit<CartItem, "id"> & { id?: string }): Promise<Cart>;
  removeItem(tx: TxContext, cartId: string, itemId: string): Promise<Cart>;
  markCheckedOut(tx: TxContext, cartId: string, expectedVersion?: number): Promise<Cart>;
}
