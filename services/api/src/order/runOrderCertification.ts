/**
 * Order Domain Certification (Sprint 5.2 + 5.3).
 * Usage: DATABASE_URL=... npm run certify:order
 *
 * Checks: schemas · tables · zero cross-context FKs · smoke AS · concurrent hold.
 */
import { Pool } from "pg";
import { createPostgresOrderStack } from "../order/createPostgresOrderStack.js";
import { getIdGenerator } from "../shared/ids/IdGenerator.js";

interface Check {
  id: string;
  ok: boolean;
  detail: string;
}

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL ?? process.env.CONTRACT_DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL required");
    process.exit(1);
  }

  const checks: Check[] = [];
  const pool = new Pool({ connectionString: url, max: 8 });

  try {
    for (const schema of ["cart", "order", "reservation"]) {
      const r = await pool.query(`SELECT 1 FROM pg_namespace WHERE nspname = $1`, [schema]);
      checks.push({
        id: `schema_${schema}`,
        ok: r.rowCount === 1,
        detail: r.rowCount === 1 ? `schema ${schema} exists` : `missing ${schema}`,
      });
    }

    const tables = [
      ["cart", "carts"],
      ["cart", "cart_items"],
      ["order", "checkout_sessions"],
      ["order", "orders"],
      ["order", "order_items"],
      ["reservation", "inventory_reservations"],
    ];
    for (const [schema, name] of tables) {
      const r = await pool.query(
        `SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = $2`,
        [schema, name],
      );
      checks.push({
        id: `table_${schema}.${name}`,
        ok: r.rowCount === 1,
        detail: r.rowCount === 1 ? "ok" : "missing",
      });
    }

    const col = await pool.query(
      `
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'reservation'
        AND table_name = 'inventory_reservations'
        AND column_name = 'request_id'
      `,
    );
    checks.push({
      id: "column_request_id",
      ok: col.rowCount === 1,
      detail: col.rowCount === 1 ? "request_id present" : "missing request_id",
    });

    // Zero FKs from order/cart/reservation into marketplace/catalog/identity
    const fk = await pool.query(`
      SELECT
        tc.table_schema || '.' || tc.table_name AS src,
        ccu.table_schema || '.' || ccu.table_name AS dst
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
       AND ccu.constraint_schema = tc.constraint_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema IN ('cart', 'order', 'reservation')
        AND ccu.table_schema IN ('marketplace', 'catalog', 'identity')
    `);
    checks.push({
      id: "no_cross_context_fk",
      ok: fk.rowCount === 0,
      detail:
        fk.rowCount === 0
          ? "no FK into marketplace/catalog/identity"
          : fk.rows.map((r) => `${r.src}→${r.dst}`).join(", "),
    });

    const stack = createPostgresOrderStack(pool);
    const buyerId = getIdGenerator().generate();
    const listingId = getIdGenerator().generate();
    const inventoryItemId = getIdGenerator().generate();

    const cart = await stack.createCart.execute({ requestId: "cert-1", buyerId });
    await stack.addCartItem.execute({
      requestId: "cert-2",
      cartId: cart.id,
      item: {
        listingId,
        catalogVariantId: getIdGenerator().generate(),
        quantity: 1,
        priceSnapshotCents: 999,
      },
    });
    const { order } = await stack.startCheckout.execute({
      requestId: "cert-3",
      cartId: cart.id,
      buyerId,
    });
    checks.push({
      id: "as_pg_checkout",
      ok: order.totalAmountCents === 999 && order.status === "PENDING",
      detail: `order=${order.id} total=${order.totalAmountCents}`,
    });

    const hold = await stack.holdReservation.execute({
      requestId: "cert-4",
      listingId,
      inventoryItemId,
      buyerId,
      quantity: 1,
      availableQuantity: 1,
    });
    checks.push({
      id: "as_pg_hold",
      ok: hold.outcome === "held",
      detail: hold.outcome === "held" ? `reservation=${hold.reservation.id}` : hold.reason,
    });

    // Concurrent oversell protection
    const raceItem = getIdGenerator().generate();
    const [ra, rb] = await Promise.all([
      stack.holdReservation.execute({
        requestId: `cert-race-a-${raceItem}`,
        listingId: getIdGenerator().generate(),
        inventoryItemId: raceItem,
        buyerId: getIdGenerator().generate(),
        quantity: 1,
        availableQuantity: 1,
      }),
      stack.holdReservation.execute({
        requestId: `cert-race-b-${raceItem}`,
        listingId: getIdGenerator().generate(),
        inventoryItemId: raceItem,
        buyerId: getIdGenerator().generate(),
        quantity: 1,
        availableQuantity: 1,
      }),
    ]);
    const heldCount = [ra, rb].filter((r) => r.outcome === "held").length;
    const rejectedCount = [ra, rb].filter((r) => r.outcome === "rejected").length;
    checks.push({
      id: "concurrent_no_oversell",
      ok: heldCount === 1 && rejectedCount === 1,
      detail: `held=${heldCount} rejected=${rejectedCount}`,
    });

    const pending = await stack.outbox.countByStatus("pending");
    checks.push({
      id: "outbox_events",
      ok: pending > 0,
      detail: `pending=${pending}`,
    });

    // Cleanup cert rows
    await pool.query(`DELETE FROM "order".order_items WHERE order_id = $1`, [order.id]);
    await pool.query(`DELETE FROM "order".orders WHERE id = $1`, [order.id]);
    await pool.query(`DELETE FROM "order".checkout_sessions WHERE cart_id = $1`, [cart.id]);
    await pool.query(`DELETE FROM cart.cart_items WHERE cart_id = $1`, [cart.id]);
    await pool.query(`DELETE FROM cart.carts WHERE id = $1`, [cart.id]);
    await pool.query(
      `DELETE FROM reservation.inventory_reservations WHERE inventory_item_id = ANY($1::uuid[])`,
      [[inventoryItemId, raceItem]],
    );
  } finally {
    await pool.end();
  }

  for (const c of checks) {
    console.log(`${c.ok ? "✓" : "✗"} ${c.id} — ${c.detail}`);
  }
  const passed = checks.every((c) => c.ok);
  console.log(passed ? "\nOrder certification PASSED" : "\nOrder certification FAILED");
  process.exit(passed ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
