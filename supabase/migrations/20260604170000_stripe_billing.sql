-- Stripe billing — subscrições, faturas e métodos de pagamento

DO $$ BEGIN
  CREATE TYPE tcg_judge.subscription_status AS ENUM (
    'incomplete', 'incomplete_expired', 'trialing', 'active',
    'past_due', 'canceled', 'unpaid', 'paused'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE tcg_judge.subscription_tier AS ENUM ('free', 'spike', 'team');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE tcg_judge.feature_name AS ENUM (
    'advanced_analytics',
    'deck_export',
    'tournament_creation',
    'team_management',
    'priority_support',
    'custom_branding',
    'api_access'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS tcg_judge.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES tcg_judge.judge_profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  tier tcg_judge.subscription_tier NOT NULL DEFAULT 'free',
  status tcg_judge.subscription_status NOT NULL DEFAULT 'incomplete',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_user_id ON tcg_judge.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub ON tcg_judge.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status
  ON tcg_judge.subscriptions(status)
  WHERE status IN ('active', 'past_due', 'trialing');

CREATE TABLE IF NOT EXISTS tcg_judge.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES tcg_judge.judge_profiles(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT UNIQUE NOT NULL,
  stripe_subscription_id TEXT,
  amount_due INTEGER,
  amount_paid INTEGER,
  currency TEXT NOT NULL DEFAULT 'brl',
  status TEXT,
  invoice_pdf TEXT,
  hosted_invoice_url TEXT,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_user ON tcg_judge.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription ON tcg_judge.invoices(stripe_subscription_id);

CREATE TABLE IF NOT EXISTS tcg_judge.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES tcg_judge.judge_profiles(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT UNIQUE NOT NULL,
  brand TEXT,
  last4 TEXT,
  exp_month INTEGER,
  exp_year INTEGER,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user ON tcg_judge.payment_methods(user_id);

DROP TRIGGER IF EXISTS subscriptions_updated_at ON tcg_judge.subscriptions;
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON tcg_judge.subscriptions
  FOR EACH ROW EXECUTE FUNCTION tcg_judge.update_updated_at_column();

ALTER TABLE tcg_judge.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tcg_judge.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE tcg_judge.payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own subscriptions" ON tcg_judge.subscriptions;
CREATE POLICY "Users see own subscriptions"
  ON tcg_judge.subscriptions FOR SELECT
  USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users see own invoices" ON tcg_judge.invoices;
CREATE POLICY "Users see own invoices"
  ON tcg_judge.invoices FOR SELECT
  USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users see own payment methods" ON tcg_judge.payment_methods;
CREATE POLICY "Users see own payment methods"
  ON tcg_judge.payment_methods FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE OR REPLACE FUNCTION tcg_judge.get_user_tier(p_user_id TEXT)
RETURNS tcg_judge.subscription_tier AS $$
DECLARE
  v_tier tcg_judge.subscription_tier;
BEGIN
  SELECT tier INTO v_tier
  FROM tcg_judge.subscriptions
  WHERE user_id = p_user_id
    AND status IN ('active', 'trialing')
  ORDER BY created_at DESC
  LIMIT 1;
  RETURN COALESCE(v_tier, 'free'::tcg_judge.subscription_tier);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = tcg_judge;

CREATE OR REPLACE FUNCTION tcg_judge.check_feature_access(p_user_id TEXT, p_feature tcg_judge.feature_name)
RETURNS BOOLEAN AS $$
DECLARE
  v_tier tcg_judge.subscription_tier;
BEGIN
  v_tier := tcg_judge.get_user_tier(p_user_id);

  IF p_feature IN ('custom_branding', 'api_access') THEN
    RETURN v_tier = 'team';
  END IF;

  IF p_feature IN (
    'advanced_analytics', 'deck_export', 'tournament_creation',
    'team_management', 'priority_support'
  ) THEN
    RETURN v_tier IN ('spike', 'team');
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = tcg_judge;
