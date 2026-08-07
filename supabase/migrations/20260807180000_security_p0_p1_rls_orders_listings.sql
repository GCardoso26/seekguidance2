-- P1 security: tighten shop_orders RLS — owner SELECT + limited UPDATE; protect financial columns.
-- Buyer read unchanged. Mutating totals/buyer/fees via PostgREST client is blocked by trigger.

DROP POLICY IF EXISTS "Orders store owner" ON shop_orders;

CREATE POLICY "Orders store owner select" ON shop_orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM stores s WHERE s.id = store_id AND s.owner_id = auth.uid()::text)
  );

CREATE POLICY "Orders store owner update" ON shop_orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM stores s WHERE s.id = store_id AND s.owner_id = auth.uid()::text)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM stores s WHERE s.id = store_id AND s.owner_id = auth.uid()::text)
  );

CREATE OR REPLACE FUNCTION tcg_judge.prevent_shop_order_financial_tamper()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- service_role / backend bypasses via role check
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF NEW.buyer_id IS DISTINCT FROM OLD.buyer_id
       OR NEW.total_cents IS DISTINCT FROM OLD.total_cents
       OR NEW.platform_fee_cents IS DISTINCT FROM OLD.platform_fee_cents
       OR NEW.store_receives_cents IS DISTINCT FROM OLD.store_receives_cents
       OR NEW.stripe_payment_intent_id IS DISTINCT FROM OLD.stripe_payment_intent_id
    THEN
      RAISE EXCEPTION 'shop_orders financial fields are immutable for clients';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_shop_orders_no_financial_tamper ON shop_orders;
CREATE TRIGGER trg_shop_orders_no_financial_tamper
  BEFORE UPDATE ON shop_orders
  FOR EACH ROW
  EXECUTE FUNCTION tcg_judge.prevent_shop_order_financial_tamper();

-- card_listings: seller CRUD for own rows (buyer SELECT active already exists)
DROP POLICY IF EXISTS "Card listings seller manage" ON card_listings;
CREATE POLICY "Card listings seller manage" ON card_listings
  FOR ALL USING (seller_id = auth.uid()::text)
  WITH CHECK (seller_id = auth.uid()::text);
