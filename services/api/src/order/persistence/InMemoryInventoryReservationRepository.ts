import type { TxParticipant } from "../../platform/transaction/InMemoryTransactionManager.js";
import type { TxContext } from "../../platform/transaction/types.js";
import { getClock } from "../../shared/time/Clock.js";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import { assertReservationTransition } from "../reservation/domain/ReservationPolicy.js";
import type {
  CreateReservationInput,
  InventoryReservationRepository,
} from "../domain/InventoryReservationRepository.js";
import type { InventoryReservation, ReservationStatus } from "../domain/models.js";

export class InMemoryInventoryReservationRepository
  implements InventoryReservationRepository, TxParticipant
{
  private rows = new Map<string, InventoryReservation>();
  private byRequestId = new Map<string, string>();
  private snapshots = new Map<
    string,
    {
      rows: Map<string, InventoryReservation>;
      byRequestId: Map<string, string>;
    }
  >();

  /** Promise chain per inventory item — released on commit/rollback. */
  private lockTail = new Map<string, Promise<void>>();
  private txUnlocks = new Map<string, Array<() => void>>();

  beginTx(txId: string): void {
    this.snapshots.set(txId, {
      rows: cloneMap(this.rows),
      byRequestId: new Map(this.byRequestId),
    });
  }
  commitTx(txId: string): void {
    this.snapshots.delete(txId);
    this.releaseLocks(txId);
  }
  rollbackTx(txId: string): void {
    const snap = this.snapshots.get(txId);
    if (snap) {
      this.rows = snap.rows;
      this.byRequestId = snap.byRequestId;
    }
    this.snapshots.delete(txId);
    this.releaseLocks(txId);
  }

  private releaseLocks(txId: string): void {
    const unlocks = this.txUnlocks.get(txId) ?? [];
    for (const u of unlocks) u();
    this.txUnlocks.delete(txId);
  }

  async lockInventoryItem(tx: TxContext, inventoryItemId: string): Promise<void> {
    const prev = this.lockTail.get(inventoryItemId) ?? Promise.resolve();
    let unlock!: () => void;
    const gate = new Promise<void>((resolve) => {
      unlock = resolve;
    });
    this.lockTail.set(
      inventoryItemId,
      prev.then(() => gate),
    );
    await prev;
    const list = this.txUnlocks.get(tx.id) ?? [];
    list.push(unlock);
    this.txUnlocks.set(tx.id, list);
  }

  async create(_tx: TxContext, input: CreateReservationInput): Promise<InventoryReservation> {
    if (input.quantity <= 0) throw new Error("reservation_quantity_invalid");
    if (input.requestId && this.byRequestId.has(input.requestId)) {
      throw new Error(`reservation_request_id_duplicate:${input.requestId}`);
    }
    const now = getClock().now();
    const reservation: InventoryReservation = {
      id: input.id ?? getIdGenerator().generate(),
      listingId: input.listingId,
      inventoryItemId: input.inventoryItemId,
      buyerId: input.buyerId,
      quantity: input.quantity,
      status: "HELD",
      expiresAt: new Date(now.getTime() + input.ttlMs),
      rowVersion: 1,
      createdAt: now,
      updatedAt: now,
    };
    this.rows.set(reservation.id, reservation);
    if (input.requestId) this.byRequestId.set(input.requestId, reservation.id);
    return structuredClone(reservation);
  }

  async findById(_tx: TxContext, id: string): Promise<InventoryReservation | null> {
    const row = this.rows.get(id);
    return row ? structuredClone(row) : null;
  }

  async findByRequestId(
    _tx: TxContext,
    requestId: string,
  ): Promise<InventoryReservation | null> {
    const id = this.byRequestId.get(requestId);
    if (!id) return null;
    return this.findById(_tx, id);
  }

  async updateStatus(
    _tx: TxContext,
    id: string,
    status: ReservationStatus,
    expectedVersion?: number,
  ): Promise<InventoryReservation> {
    const row = this.rows.get(id);
    if (!row) throw new Error("reservation_not_found");
    if (expectedVersion != null && row.rowVersion !== expectedVersion) {
      throw new Error(`optimistic_lock_failed:reservation:${id}`);
    }
    assertReservationTransition(row.status, status);
    row.status = status;
    row.rowVersion += 1;
    row.updatedAt = getClock().now();
    this.rows.set(id, row);
    return structuredClone(row);
  }

  async heldQuantityForInventory(
    _tx: TxContext,
    inventoryItemId: string,
  ): Promise<number> {
    const now = getClock().now();
    return [...this.rows.values()]
      .filter(
        (r) =>
          r.inventoryItemId === inventoryItemId &&
          r.status === "HELD" &&
          r.expiresAt.getTime() > now.getTime(),
      )
      .reduce((sum, r) => sum + r.quantity, 0);
  }

  async reservedQuantityForInventory(
    _tx: TxContext,
    inventoryItemId: string,
  ): Promise<number> {
    const now = getClock().now();
    return [...this.rows.values()]
      .filter((r) => {
        if (r.inventoryItemId !== inventoryItemId) return false;
        if (r.status === "CONFIRMED") return true;
        return r.status === "HELD" && r.expiresAt.getTime() > now.getTime();
      })
      .reduce((sum, r) => sum + r.quantity, 0);
  }

  async listExpiredHeld(_tx: TxContext, now: Date): Promise<InventoryReservation[]> {
    return [...this.rows.values()]
      .filter((r) => r.status === "HELD" && r.expiresAt.getTime() <= now.getTime())
      .map((r) => structuredClone(r));
  }
}

function cloneMap(
  src: Map<string, InventoryReservation>,
): Map<string, InventoryReservation> {
  const out = new Map<string, InventoryReservation>();
  for (const [k, v] of src) out.set(k, structuredClone(v));
  return out;
}
