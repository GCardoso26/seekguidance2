-- Language on store_products (CSV singles / physical SKUs).
ALTER TABLE tcg_judge.store_products
  ADD COLUMN IF NOT EXISTS language VARCHAR(10) NOT NULL DEFAULT 'pt';
