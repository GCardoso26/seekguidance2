-- Sprint 5.3 — Reservation Engine
-- Idempotency key (request_id) + no cross-context FKs.
-- Concurrency: application uses pg_advisory_xact_lock(inventory_item_id).

BEGIN;

ALTER TABLE reservation.inventory_reservations
  ADD COLUMN IF NOT EXISTS request_id text;

CREATE UNIQUE INDEX IF NOT EXISTS uq_reservation_request_id
  ON reservation.inventory_reservations (request_id)
  WHERE request_id IS NOT NULL;

COMMENT ON COLUMN reservation.inventory_reservations.request_id IS
  'Hold idempotency key — retry same request returns existing HELD (Sprint 5.3).';

COMMIT;
