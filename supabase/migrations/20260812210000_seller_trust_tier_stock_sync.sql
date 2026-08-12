-- Fase 3: trust tier + sync de estoque (ADR-018)
SET search_path TO tcg_judge, public;

ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS trust_tier VARCHAR(32);

ALTER TABLE stores
  DROP CONSTRAINT IF EXISTS stores_trust_tier_check;

ALTER TABLE stores
  ADD CONSTRAINT stores_trust_tier_check
  CHECK (
    trust_tier IS NULL
    OR trust_tier IN ('verified', 'established', 'recommended')
  );

ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS last_inventory_sync_at TIMESTAMPTZ;

COMMENT ON COLUMN stores.trust_tier IS
  'ADR-018: verified | established | recommended — selo de vitrine';
COMMENT ON COLUMN stores.last_inventory_sync_at IS
  'Último sync/import de estoque (CSV/API) para o painel operacional';

-- Lojas já aprovadas / verificadas começam como Verificada.
UPDATE stores
SET trust_tier = 'verified'
WHERE trust_tier IS NULL
  AND (
    accreditation_status = 'approved'
    OR verification_status = 'verified'
  )
  AND cnpj IS NOT NULL
  AND BTRIM(cnpj) <> '';

CREATE INDEX IF NOT EXISTS idx_stores_trust_tier
  ON stores (trust_tier)
  WHERE trust_tier IS NOT NULL;
