import type { TxContext } from "../../platform/transaction/types.js";
import type { InventoryReservation, ReservationStatus } from "./models.js";

export interface CreateReservationInput {
  id?: string;
  listingId: string;
  inventoryItemId: string;
  buyerId: string;
  quantity: number;
  ttlMs: number;
  /** Hold idempotency key — retry with same requestId returns existing row. */
  requestId?: string;
}

export interface InventoryReservationRepository {
  create(tx: TxContext, input: CreateReservationInput): Promise<InventoryReservation>;
  findById(tx: TxContext, id: string): Promise<InventoryReservation | null>;
  findByRequestId(tx: TxContext, requestId: string): Promise<InventoryReservation | null>;
  updateStatus(
    tx: TxContext,
    id: string,
    status: ReservationStatus,
    expectedVersion?: number,
  ): Promise<InventoryReservation>;
  /** Active HELD quantity (non-expired) for an inventory item. */
  heldQuantityForInventory(tx: TxContext, inventoryItemId: string): Promise<number>;
  /**
   * Quantity that blocks new holds: non-expired HELD + CONFIRMED.
   * RELEASED / EXPIRED do not count (stock available again).
   */
  reservedQuantityForInventory(tx: TxContext, inventoryItemId: string): Promise<number>;
  /** Serialize concurrent holds for the same inventory item (advisory lock / mutex). */
  lockInventoryItem(tx: TxContext, inventoryItemId: string): Promise<void>;
  /** HELD rows with expires_at ≤ now. */
  listExpiredHeld(tx: TxContext, now: Date): Promise<InventoryReservation[]>;
}
