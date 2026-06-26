-- URL de onboarding Stripe com expiração (regeneração automática)

SET search_path TO tcg_judge, public;

ALTER TABLE merchant_profiles
  ADD COLUMN IF NOT EXISTS onboarding_url TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_expires_at TIMESTAMPTZ;

COMMENT ON COLUMN merchant_profiles.onboarding_url IS 'Último AccountLink Stripe (account_onboarding)';
COMMENT ON COLUMN merchant_profiles.onboarding_expires_at IS 'Expiração local do link — regenerar via API se passado';
