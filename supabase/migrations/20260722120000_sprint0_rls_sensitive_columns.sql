-- Sprint 0: impedir auto-elevação de CPF/KYC/pagamentos via cliente Supabase autenticado

SET search_path TO tcg_judge, public;

CREATE OR REPLACE FUNCTION tcg_judge.is_service_role()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(auth.jwt() ->> 'role', '') = 'service_role';
$$;

-- player_profiles: bloqueia alteração de campos CPF/conta pelo próprio usuário
CREATE OR REPLACE FUNCTION tcg_judge.guard_player_profile_sensitive_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF tcg_judge.is_service_role() THEN
    RETURN NEW;
  END IF;

  IF auth.uid()::text IS DISTINCT FROM OLD.id THEN
    RETURN NEW;
  END IF;

  IF NEW.cpf_hash IS DISTINCT FROM OLD.cpf_hash
     OR NEW.cpf_last4 IS DISTINCT FROM OLD.cpf_last4
     OR NEW.cpf_verified_at IS DISTINCT FROM OLD.cpf_verified_at
     OR NEW.account_status IS DISTINCT FROM OLD.account_status THEN
    RAISE EXCEPTION 'player_profiles: campos de CPF/conta só podem ser alterados pela API';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_player_profile_sensitive ON player_profiles;
CREATE TRIGGER trg_guard_player_profile_sensitive
  BEFORE UPDATE ON player_profiles
  FOR EACH ROW
  EXECUTE FUNCTION tcg_judge.guard_player_profile_sensitive_columns();

-- merchant_profiles: bloqueia alteração de KYC/Stripe pelo dono
CREATE OR REPLACE FUNCTION tcg_judge.guard_merchant_profile_sensitive_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF tcg_judge.is_service_role() THEN
    RETURN NEW;
  END IF;

  IF auth.uid()::text IS DISTINCT FROM OLD.user_id THEN
    RETURN NEW;
  END IF;

  IF NEW.kyc_status IS DISTINCT FROM OLD.kyc_status
     OR NEW.provider_account_id IS DISTINCT FROM OLD.provider_account_id
     OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason
     OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
     OR NEW.onboarding_url IS DISTINCT FROM OLD.onboarding_url
     OR NEW.onboarding_expires_at IS DISTINCT FROM OLD.onboarding_expires_at
     OR NEW.kyc_provider IS DISTINCT FROM OLD.kyc_provider THEN
    RAISE EXCEPTION 'merchant_profiles: campos KYC só podem ser alterados pela API';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_merchant_profile_sensitive ON merchant_profiles;
CREATE TRIGGER trg_guard_merchant_profile_sensitive
  BEFORE UPDATE ON merchant_profiles
  FOR EACH ROW
  EXECUTE FUNCTION tcg_judge.guard_merchant_profile_sensitive_columns();

-- stores: bloqueia habilitar venda/Stripe sem backend
CREATE OR REPLACE FUNCTION tcg_judge.guard_store_payment_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF tcg_judge.is_service_role() THEN
    RETURN NEW;
  END IF;

  IF auth.uid()::text IS DISTINCT FROM OLD.owner_id THEN
    RETURN NEW;
  END IF;

  IF NEW.stripe_account_id IS DISTINCT FROM OLD.stripe_account_id
     OR NEW.stripe_onboarding_complete IS DISTINCT FROM OLD.stripe_onboarding_complete
     OR NEW.shop_enabled IS DISTINCT FROM OLD.shop_enabled
     OR NEW.commission_rate IS DISTINCT FROM OLD.commission_rate THEN
    RAISE EXCEPTION 'stores: campos de pagamento só podem ser alterados pela API';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_store_payment_columns ON stores;
CREATE TRIGGER trg_guard_store_payment_columns
  BEFORE UPDATE ON stores
  FOR EACH ROW
  EXECUTE FUNCTION tcg_judge.guard_store_payment_columns();

-- merchant_profiles: restringir política FOR ALL → SELECT + INSERT básico
DROP POLICY IF EXISTS merchant_profiles_owner ON merchant_profiles;
CREATE POLICY merchant_profiles_owner_select ON merchant_profiles
  FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY merchant_profiles_owner_insert ON merchant_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

COMMENT ON FUNCTION tcg_judge.guard_player_profile_sensitive_columns IS
  'Sprint 0 — impede bypass de CPF via RLS UPDATE direto';
COMMENT ON FUNCTION tcg_judge.guard_merchant_profile_sensitive_columns IS
  'Sprint 0 — impede auto-verificação KYC via cliente Supabase';
