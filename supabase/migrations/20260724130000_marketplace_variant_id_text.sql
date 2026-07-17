-- P0 Release 1: catalog_variant_id is an opaque Catalog reference (ADR-007 overlay).
-- Public API exposes finishes as `{cardId}:{finish}`; marketplace must accept that string.
-- UUID columns rejected publish and blocked Liquidity Proof.

ALTER TABLE marketplace.inventory_items
  ALTER COLUMN catalog_variant_id TYPE text USING catalog_variant_id::text;

ALTER TABLE marketplace.listings
  ALTER COLUMN catalog_variant_id TYPE text USING catalog_variant_id::text;

COMMENT ON COLUMN marketplace.inventory_items.catalog_variant_id IS
  'Opaque Catalog variant ref (UUID or cardId:finish) — never denormalize Catalog fields';

COMMENT ON COLUMN marketplace.listings.catalog_variant_id IS
  'Opaque Catalog variant ref (UUID or cardId:finish) — never denormalize Catalog fields';
