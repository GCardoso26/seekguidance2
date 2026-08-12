-- ADR-018: Hobby Store CNPJ accreditation + grandfather window
SET search_path TO tcg_judge, public;

ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS accreditation_status VARCHAR(32) NOT NULL DEFAULT 'approved';

ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS accreditation_deadline_at TIMESTAMPTZ;

ALTER TABLE stores
  DROP CONSTRAINT IF EXISTS stores_accreditation_status_check;

ALTER TABLE stores
  ADD CONSTRAINT stores_accreditation_status_check
  CHECK (
    accreditation_status IN (
      'draft',
      'submitted',
      'under_review',
      'approved',
      'rejected',
      'grandfathered',
      'pending'
    )
  );

ALTER TABLE stores DROP CONSTRAINT IF EXISTS stores_subscription_plan_check;
ALTER TABLE stores ADD CONSTRAINT stores_subscription_plan_check
  CHECK (
    subscription_plan IN (
      'free',
      'pending_accreditation',
      'lojista',
      'pro',
      'enterprise'
    )
  );

-- New stores should not inherit free by DB default; application sets pending_accreditation.
ALTER TABLE stores ALTER COLUMN subscription_plan SET DEFAULT 'pending_accreditation';

-- Grandfather: free plan and/or missing CNPJ get a 45-day remediation window.
UPDATE stores
SET
  accreditation_status = 'grandfathered',
  accreditation_deadline_at = COALESCE(
    accreditation_deadline_at,
    NOW() + INTERVAL '45 days'
  )
WHERE accreditation_status = 'approved'
  AND (
    subscription_plan = 'free'
    OR cnpj IS NULL
    OR BTRIM(cnpj) = ''
  );

-- Stores already on a paid plan with CNPJ stay approved.
UPDATE stores
SET accreditation_status = 'approved',
    accreditation_deadline_at = NULL
WHERE subscription_plan IN ('lojista', 'pro', 'enterprise')
  AND cnpj IS NOT NULL
  AND BTRIM(cnpj) <> ''
  AND accreditation_status IN ('approved', 'grandfathered');

CREATE INDEX IF NOT EXISTS idx_stores_accreditation_status
  ON stores (accreditation_status);

CREATE INDEX IF NOT EXISTS idx_stores_accreditation_deadline
  ON stores (accreditation_deadline_at)
  WHERE accreditation_deadline_at IS NOT NULL;
