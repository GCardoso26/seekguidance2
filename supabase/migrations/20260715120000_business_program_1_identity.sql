-- Business Program 1 — Identity Platform (additive, RC1-compatible)
SET search_path TO tcg_judge, public;

-- Thin identity extension over player_profiles
CREATE TABLE IF NOT EXISTS identity_users (
  user_id TEXT PRIMARY KEY,
  email TEXT,
  phone TEXT,
  address JSONB NOT NULL DEFAULT '{}'::jsonb,
  mfa_status TEXT NOT NULL DEFAULT 'disabled'
    CHECK (mfa_status IN ('disabled', 'pending', 'ready')),
  passkey_status TEXT NOT NULL DEFAULT 'disabled'
    CHECK (passkey_status IN ('disabled', 'pending', 'ready')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj TEXT UNIQUE,
  legal_name TEXT NOT NULL,
  trade_name TEXT,
  state_registration TEXT,
  address JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending_cnpj'
    CHECK (status IN ('pending_cnpj', 'active', 'suspended', 'closed')),
  kyc_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (kyc_status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'restricted')),
  trust_score INT NOT NULL DEFAULT 0 CHECK (trust_score BETWEEN 0 AND 100),
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_cnpj ON companies(cnpj);

CREATE TABLE IF NOT EXISTS company_representatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  is_legal_rep BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_company_reps_user ON company_representatives(user_id);

ALTER TABLE stores ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_stores_company ON stores(company_id);

CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  role TEXT NOT NULL
    CHECK (role IN (
      'BUYER', 'SELLER_OWNER', 'SELLER_MANAGER', 'SELLER_STAFF', 'SELLER_STOCK',
      'SELLER_FINANCE', 'SELLER_SUPPORT', 'SELLER_JUDGE', 'SELLER_EVENT_MANAGER',
      'ADMIN', 'SUPER_ADMIN'
    )),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('invited', 'active', 'suspended', 'revoked')),
  invited_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, store_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_store ON memberships(store_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);

CREATE TABLE IF NOT EXISTS store_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  invited_by TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  accepted_by TEXT,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_invitations_store ON store_invitations(store_id);
CREATE INDEX IF NOT EXISTS idx_store_invitations_email ON store_invitations(email);

CREATE TABLE IF NOT EXISTS platform_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type TEXT NOT NULL CHECK (subject_type IN ('user', 'company', 'store')),
  subject_id TEXT NOT NULL,
  plan TEXT NOT NULL
    CHECK (plan IN ('FREE', 'PRO', 'SELLER_STARTER', 'SELLER_PRO', 'ENTERPRISE')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_subs_subject
  ON platform_subscriptions(subject_type, subject_id);

CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type TEXT NOT NULL CHECK (owner_type IN ('user', 'company', 'store')),
  owner_id TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (owner_type, owner_id)
);

CREATE TABLE IF NOT EXISTS wallet_ledgers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  balance_type TEXT NOT NULL
    CHECK (balance_type IN ('cashback', 'credit', 'gift_card', 'refund', 'balance', 'store_credit')),
  amount_cents INT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  reference_type TEXT,
  reference_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_ledgers_wallet ON wallet_ledgers(wallet_id);

CREATE TABLE IF NOT EXISTS store_payment_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  inventory_type TEXT NOT NULL
    CHECK (inventory_type IN ('PRODUCT', 'EVENT', 'SERVICE', 'DIGITAL', 'GIFT_CARD')),
  methods TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (store_id, inventory_type)
);

CREATE TABLE IF NOT EXISTS company_kyc_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'restricted')),
  submitted_by TEXT,
  submitted_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  case_id UUID REFERENCES company_kyc_cases(id) ON DELETE SET NULL,
  doc_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  storage_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lgpd_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  purpose TEXT NOT NULL
    CHECK (purpose IN ('analytics', 'marketing', 'marketplace', 'events', 'cookies')),
  granted BOOLEAN NOT NULL DEFAULT FALSE,
  version TEXT NOT NULL DEFAULT '1',
  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, purpose)
);

CREATE TABLE IF NOT EXISTS store_trust_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  score INT NOT NULL CHECK (score BETWEEN 0 AND 100),
  factors JSONB NOT NULL DEFAULT '{}'::jsonb,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_trust_store ON store_trust_snapshots(store_id, computed_at DESC);

CREATE TABLE IF NOT EXISTS buyer_trust_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  score INT NOT NULL CHECK (score BETWEEN 0 AND 100),
  factors JSONB NOT NULL DEFAULT '{}'::jsonb,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buyer_trust_user ON buyer_trust_snapshots(user_id, computed_at DESC);

-- RLS enable (service role / backend uses bypass; matches recent migrations style)
ALTER TABLE identity_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_representatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_payment_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_kyc_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE lgpd_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_trust_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_trust_snapshots ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE companies IS 'Business Program 1 — Company bounded context';
COMMENT ON TABLE memberships IS 'User↔Store membership with PlatformRole; no boolean role flags';
COMMENT ON COLUMN stores.company_id IS 'Nullable link Company→Store (1..N); RC1 owner_id unchanged';
