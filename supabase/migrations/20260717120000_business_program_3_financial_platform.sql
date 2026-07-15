-- Business Program 3 — Financial Platform (additive, RC1-compatible)
SET search_path TO tcg_judge, public;

CREATE TABLE IF NOT EXISTS fin_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  owner_type TEXT NOT NULL
    CHECK (owner_type IN ('buyer', 'seller', 'company', 'store', 'platform', 'judge')),
  owner_id TEXT NOT NULL,
  account_type TEXT NOT NULL
    CHECK (account_type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  currency TEXT NOT NULL DEFAULT 'BRL',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (code),
  UNIQUE (owner_type, owner_id, account_type, currency)
);

CREATE INDEX IF NOT EXISTS idx_fin_accounts_owner ON fin_accounts(owner_type, owner_id);

CREATE TABLE IF NOT EXISTS fin_journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT NOT NULL UNIQUE,
  correlation_id TEXT NOT NULL,
  actor_id TEXT,
  source TEXT NOT NULL DEFAULT 'financial_platform',
  txn_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'posted'
    CHECK (status IN ('posted', 'voided')),
  memo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fin_journals_correlation ON fin_journals(correlation_id);
CREATE INDEX IF NOT EXISTS idx_fin_journals_created ON fin_journals(created_at DESC);

CREATE TABLE IF NOT EXISTS fin_journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID NOT NULL REFERENCES fin_journals(id) ON DELETE RESTRICT,
  account_id UUID NOT NULL REFERENCES fin_accounts(id) ON DELETE RESTRICT,
  debit_cents INT NOT NULL DEFAULT 0 CHECK (debit_cents >= 0),
  credit_cents INT NOT NULL DEFAULT 0 CHECK (credit_cents >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (NOT (debit_cents > 0 AND credit_cents > 0)),
  CHECK (debit_cents > 0 OR credit_cents > 0)
);

CREATE INDEX IF NOT EXISTS idx_fin_journal_entries_journal ON fin_journal_entries(journal_id);
CREATE INDEX IF NOT EXISTS idx_fin_journal_entries_account ON fin_journal_entries(account_id);

CREATE TABLE IF NOT EXISTS fin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID REFERENCES fin_journals(id) ON DELETE SET NULL,
  txn_type TEXT NOT NULL
    CHECK (txn_type IN (
      'purchase', 'refund', 'cashback', 'withdrawal', 'deposit', 'adjustment',
      'prize', 'gift_card', 'store_credit', 'fee', 'commission', 'settlement', 'transfer'
    )),
  amount_cents INT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BRL',
  subject_type TEXT,
  subject_id TEXT,
  order_ref TEXT,
  psp_ref TEXT,
  status TEXT NOT NULL DEFAULT 'completed'
    CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key TEXT UNIQUE,
  correlation_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fin_transactions_subject ON fin_transactions(subject_type, subject_id, created_at DESC);

CREATE TABLE IF NOT EXISTS fin_escrow_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_ref TEXT,
  rc1_escrow_id TEXT,
  amount_cents INT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL DEFAULT 'held'
    CHECK (status IN ('held', 'released', 'disputed', 'cancelled', 'manual_hold')),
  hold_until TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fin_escrow_status ON fin_escrow_cases(status);

CREATE TABLE IF NOT EXISTS fin_split_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  scope_type TEXT NOT NULL DEFAULT 'store'
    CHECK (scope_type IN ('global', 'store', 'event', 'campaign')),
  scope_id TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fin_split_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES fin_split_rules(id) ON DELETE CASCADE,
  beneficiary TEXT NOT NULL
    CHECK (beneficiary IN ('marketplace', 'store', 'judge', 'organizer', 'affiliate', 'campaign')),
  percent_bps INT NOT NULL CHECK (percent_bps >= 0 AND percent_bps <= 10000),
  fixed_cents INT NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_fin_split_lines_rule ON fin_split_lines(rule_id);

CREATE TABLE IF NOT EXISTS fin_settlement_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id TEXT,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'closing', 'closed', 'reconciled')),
  rc1_settlement_id TEXT,
  total_cents INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS fin_payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id TEXT NOT NULL,
  amount_cents INT NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  scheduled_for TIMESTAMPTZ,
  idempotency_key TEXT UNIQUE,
  psp_ref TEXT,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fin_payouts_store ON fin_payout_requests(store_id, status);

CREATE TABLE IF NOT EXISTS fin_store_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type TEXT NOT NULL DEFAULT 'buyer',
  owner_id TEXT NOT NULL,
  store_id TEXT,
  amount_cents INT NOT NULL DEFAULT 0 CHECK (amount_cents >= 0),
  remaining_cents INT NOT NULL DEFAULT 0 CHECK (remaining_cents >= 0),
  reason TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fin_store_credits_owner ON fin_store_credits(owner_type, owner_id);

CREATE TABLE IF NOT EXISTS fin_cashback_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  scope_type TEXT NOT NULL
    CHECK (scope_type IN ('global', 'store', 'category', 'product', 'plan', 'campaign')),
  scope_id TEXT,
  percent_bps INT NOT NULL DEFAULT 0,
  fixed_cents INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fin_cashback_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  rule_id UUID REFERENCES fin_cashback_rules(id) ON DELETE SET NULL,
  amount_cents INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('pending', 'available', 'used', 'expired')),
  order_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fin_cashback_user ON fin_cashback_ledger(user_id, status);

CREATE TABLE IF NOT EXISTS fin_gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_hash TEXT NOT NULL UNIQUE,
  card_type TEXT NOT NULL
    CHECK (card_type IN ('marketplace', 'store', 'event', 'promo', 'reload')),
  store_id TEXT,
  amount_cents INT NOT NULL CHECK (amount_cents > 0),
  remaining_cents INT NOT NULL CHECK (remaining_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'BRL',
  expires_at TIMESTAMPTZ,
  transferable BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'redeemed', 'expired', 'void')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fin_refund_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_ref TEXT,
  amount_cents INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'review', 'approved', 'executed', 'rejected')),
  destination TEXT NOT NULL DEFAULT 'psp'
    CHECK (destination IN ('psp', 'wallet', 'store_credit')),
  actor_id TEXT,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fin_chargeback_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  psp_dispute_id TEXT,
  rc1_chargeback_id TEXT,
  amount_cents INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'analysis', 'won', 'lost', 'reversed')),
  order_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fin_commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_type TEXT NOT NULL
    CHECK (fee_type IN ('marketplace', 'seller', 'judge', 'event', 'affiliate', 'campaign')),
  scope_type TEXT NOT NULL DEFAULT 'global',
  scope_id TEXT,
  percent_bps INT NOT NULL DEFAULT 0,
  fixed_cents INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fin_store_policies (
  store_id TEXT PRIMARY KEY,
  payout_delay_days INT NOT NULL DEFAULT 7,
  payout_min_cents INT NOT NULL DEFAULT 5000,
  allow_wallet BOOLEAN NOT NULL DEFAULT FALSE,
  allow_counter BOOLEAN NOT NULL DEFAULT TRUE,
  allow_installments BOOLEAN NOT NULL DEFAULT FALSE,
  cashback_rule_id UUID,
  split_rule_id UUID,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  actor_id TEXT,
  correlation_id TEXT,
  origin TEXT,
  ledger_journal_id UUID,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fin_audit_correlation ON fin_audit_log(correlation_id);

CREATE TABLE IF NOT EXISTS mart_wallet (
  owner_type TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  available_cents INT NOT NULL DEFAULT 0,
  reserved_cents INT NOT NULL DEFAULT 0,
  pending_cents INT NOT NULL DEFAULT 0,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (owner_type, owner_id)
);

CREATE TABLE IF NOT EXISTS mart_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day DATE NOT NULL,
  txn_type TEXT NOT NULL,
  count INT NOT NULL DEFAULT 0,
  volume_cents INT NOT NULL DEFAULT 0,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (day, txn_type)
);

CREATE TABLE IF NOT EXISTS mart_cashback (
  user_id TEXT PRIMARY KEY,
  available_cents INT NOT NULL DEFAULT 0,
  used_cents INT NOT NULL DEFAULT 0,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mart_store_credit (
  owner_id TEXT PRIMARY KEY,
  remaining_cents INT NOT NULL DEFAULT 0,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mart_settlement (
  store_id TEXT PRIMARY KEY,
  open_runs INT NOT NULL DEFAULT 0,
  last_closed_at TIMESTAMPTZ,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mart_payout (
  store_id TEXT PRIMARY KEY,
  pending_cents INT NOT NULL DEFAULT 0,
  completed_cents INT NOT NULL DEFAULT 0,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mart_revenue (
  day DATE PRIMARY KEY,
  gmv_cents INT NOT NULL DEFAULT 0,
  fee_cents INT NOT NULL DEFAULT 0,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mart_commission (
  fee_type TEXT PRIMARY KEY,
  volume_cents INT NOT NULL DEFAULT 0,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mart_refunds (
  day DATE PRIMARY KEY,
  count INT NOT NULL DEFAULT 0,
  amount_cents INT NOT NULL DEFAULT 0,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mart_chargebacks (
  day DATE PRIMARY KEY,
  count INT NOT NULL DEFAULT 0,
  amount_cents INT NOT NULL DEFAULT 0,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mart_financial_health (
  subject_type TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  health_score INT NOT NULL DEFAULT 50 CHECK (health_score BETWEEN 0 AND 100),
  factors JSONB NOT NULL DEFAULT '{}'::jsonb,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (subject_type, subject_id)
);

ALTER TABLE fin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fin_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE fin_journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE fin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fin_escrow_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE fin_payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE fin_gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE fin_refund_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE fin_audit_log ENABLE ROW LEVEL SECURITY;
