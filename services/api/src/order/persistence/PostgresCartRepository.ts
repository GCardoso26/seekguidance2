import { requirePostgresClient } from "../../platform/transaction/types.js";
import type { TxContext } from "../../platform/transaction/types.js";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import type { CartRepository, CreateCartInput } from "../domain/CartRepository.js";
import type { Cart, CartItem } from "../domain/models.js";

export class PostgresCartRepository implements CartRepository {
  async create(tx: TxContext, input: CreateCartInput): Promise<Cart> {
    const client = requirePostgresClient(tx);
    const id = input.id ?? getIdGenerator().generate();
    const res = await client.query(
      `
      INSERT INTO cart.carts (id, buyer_id, status, row_version)
      VALUES ($1, $2, 'open', 1)
      RETURNING *
      `,
      [id, input.buyerId],
    );
    return mapCart(res.rows[0], []);
  }

  async findById(tx: TxContext, id: string): Promise<Cart | null> {
    const client = requirePostgresClient(tx);
    const res = await client.query(`SELECT * FROM cart.carts WHERE id = $1`, [id]);
    if (!res.rows[0]) return null;
    const items = await this.loadItems(tx, id);
    return mapCart(res.rows[0], items);
  }

  async findOpenByBuyer(tx: TxContext, buyerId: string): Promise<Cart | null> {
    const client = requirePostgresClient(tx);
    const res = await client.query(
      `SELECT * FROM cart.carts WHERE buyer_id = $1 AND status = 'open' ORDER BY created_at DESC LIMIT 1`,
      [buyerId],
    );
    if (!res.rows[0]) return null;
    const items = await this.loadItems(tx, String(res.rows[0].id));
    return mapCart(res.rows[0], items);
  }

  async addItem(
    tx: TxContext,
    cartId: string,
    item: Omit<CartItem, "id"> & { id?: string },
  ): Promise<Cart> {
    const client = requirePostgresClient(tx);
    const cart = await this.findById(tx, cartId);
    if (!cart) throw new Error("cart_not_found");
    if (cart.status !== "open") throw new Error("cart_not_open");
    if (item.quantity <= 0) throw new Error("cart_item_quantity_invalid");
    if (item.priceSnapshotCents < 0) throw new Error("cart_item_price_invalid");

    const itemId = item.id ?? getIdGenerator().generate();
    // ON CONFLICT: bump quantity, KEEP original price_snapshot_cents (frozen).
    await client.query(
      `
      INSERT INTO cart.cart_items
        (id, cart_id, listing_id, catalog_variant_id, quantity, price_snapshot_cents, currency)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (cart_id, listing_id) DO UPDATE SET
        quantity = cart.cart_items.quantity + EXCLUDED.quantity
      `,
      [
        itemId,
        cartId,
        item.listingId,
        item.catalogVariantId,
        item.quantity,
        item.priceSnapshotCents,
        item.currency ?? "BRL",
      ],
    );
    await client.query(
      `UPDATE cart.carts SET row_version = row_version + 1, updated_at = now() WHERE id = $1`,
      [cartId],
    );
    return (await this.findById(tx, cartId))!;
  }

  async removeItem(tx: TxContext, cartId: string, itemId: string): Promise<Cart> {
    const client = requirePostgresClient(tx);
    const cart = await this.findById(tx, cartId);
    if (!cart) throw new Error("cart_not_found");
    if (cart.status !== "open") throw new Error("cart_not_open");
    await client.query(`DELETE FROM cart.cart_items WHERE id = $1 AND cart_id = $2`, [
      itemId,
      cartId,
    ]);
    await client.query(
      `UPDATE cart.carts SET row_version = row_version + 1, updated_at = now() WHERE id = $1`,
      [cartId],
    );
    return (await this.findById(tx, cartId))!;
  }

  async markCheckedOut(
    tx: TxContext,
    cartId: string,
    expectedVersion?: number,
  ): Promise<Cart> {
    const client = requirePostgresClient(tx);
    const cart = await this.findById(tx, cartId);
    if (!cart) throw new Error("cart_not_found");
    if (expectedVersion != null && cart.rowVersion !== expectedVersion) {
      throw new Error(`optimistic_lock_failed:cart:${cartId}`);
    }
    const res = await client.query(
      `
      UPDATE cart.carts
      SET status = 'checked_out', row_version = row_version + 1, updated_at = now()
      WHERE id = $1
      RETURNING *
      `,
      [cartId],
    );
    return mapCart(res.rows[0], cart.items);
  }

  private async loadItems(tx: TxContext, cartId: string): Promise<CartItem[]> {
    const client = requirePostgresClient(tx);
    const res = await client.query(
      `SELECT * FROM cart.cart_items WHERE cart_id = $1 ORDER BY created_at`,
      [cartId],
    );
    return res.rows.map(mapItem);
  }
}

function mapCart(row: Record<string, unknown>, items: CartItem[]): Cart {
  return {
    id: String(row.id),
    buyerId: String(row.buyer_id),
    status: row.status as Cart["status"],
    items,
    rowVersion: Number(row.row_version ?? 1),
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  };
}

function mapItem(row: Record<string, unknown>): CartItem {
  return {
    id: String(row.id),
    listingId: String(row.listing_id),
    catalogVariantId: String(row.catalog_variant_id),
    quantity: Number(row.quantity),
    priceSnapshotCents: Number(row.price_snapshot_cents),
    currency: row.currency as "BRL",
  };
}
