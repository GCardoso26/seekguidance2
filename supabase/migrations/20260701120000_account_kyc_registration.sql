-- Registro: account_status (jogador), merchant_profiles (KYC lojista), audit logs

SET search_path TO tcg_judge, public;

ALTER TABLE player_profiles
  ADD COLUMN IF NOT EXISTS account_status VARCHAR(24) NOT NULL DEFAULT 'pending_cpf'
    CHECK (account_status IN ('pending_cpf', 'active', 'suspended')),
  ADD COLUMN IF NOT EXISTS cpf_hash TEXT,
  ADD COLUMN IF NOT EXISTS cpf_last4 VARCHAR(4),
  ADD COLUMN IF NOT EXISTS cpf_verified_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_player_profiles_cpf_hash
  ON player_profiles(cpf_hash) WHERE cpf_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_player_profiles_account_status
  ON player_profiles(account_status);

-- Perfis existentes: não bloquear até completarem CPF voluntariamente no Go-Live
UPDATE player_profiles
SET account_status = 'active'
WHERE account_status = 'pending_cpf' AND cpf_hash IS NULL;

CREATE TABLE IF NOT EXISTS merchant_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE REFERENCES player_profiles(id) ON DELETE CASCADE,
  store_id UUID UNIQUE REFERENCES stores(id) ON DELETE SET NULL,
  kyc_status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (kyc_status IN ('pending', 'verified', 'rejected', 'restricted')),
  kyc_provider VARCHAR(32) NOT NULL DEFAULT 'stripe',
  provider_account_id TEXT,
  rejection_reason TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merchant_profiles_kyc_status ON merchant_profiles(kyc_status);
CREATE INDEX IF NOT EXISTS idx_merchant_profiles_store ON merchant_profiles(store_id);

CREATE TABLE IF NOT EXISTS kyc_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES player_profiles(id) ON DELETE SET NULL,
  merchant_profile_id UUID REFERENCES merchant_profiles(id) ON DELETE SET NULL,
  entity_type VARCHAR(16) NOT NULL CHECK (entity_type IN ('player', 'merchant')),
  old_status TEXT,
  new_status TEXT NOT NULL,
  reason TEXT,
  provider_event_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_kyc_audit_provider_event
  ON kyc_audit_logs(provider_event_id) WHERE provider_event_id IS NOT NULL;

ALTER TABLE merchant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS merchant_profiles_owner ON merchant_profiles;
CREATE POLICY merchant_profiles_owner ON merchant_profiles
  FOR ALL USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS kyc_audit_owner ON kyc_audit_logs;
CREATE POLICY kyc_audit_owner ON kyc_audit_logs
  FOR SELECT USING (user_id = auth.uid()::text);

COMMENT ON TABLE merchant_profiles IS 'Perfil lojista — KYC via Stripe Connect / Pagar.me';
COMMENT ON TABLE kyc_audit_logs IS 'Auditoria de mudanças de status CPF/KYC';
