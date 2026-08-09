-- Seller event tickets: CEP da loja para auto-fill e distância hub
SET search_path TO tcg_judge, public;

ALTER TABLE tcg_judge.stores
  ADD COLUMN IF NOT EXISTS postal_code VARCHAR(16);
