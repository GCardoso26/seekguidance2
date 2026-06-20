-- Marketplace neutro: PIX direto (padrão), Stripe Connect opcional, assinatura Pro

SET search_path TO tcg_judge, public;

-- Pagamentos PIX na loja
ALTER TABLE stores ADD COLUMN IF NOT EXISTS pix_key_type TEXT
  CHECK (pix_key_type IS NULL OR pix_key_type IN ('cpf', 'cnpj', 'email', 'phone', 'random'));
ALTER TABLE stores ADD COLUMN IF NOT EXISTS pix_key TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS payment_method_preference TEXT NOT NULL DEFAULT 'pix'
  CHECK (payment_method_preference IN ('pix', 'stripe', 'both'));

-- Comissão zero no modelo neutro (preserva coluna para lojas legadas)
ALTER TABLE stores ALTER COLUMN commission_rate SET DEFAULT 0;

-- Pedidos: método de pagamento
ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'pix'
  CHECK (payment_method IN ('pix', 'stripe'));
ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS pix_txid TEXT;

CREATE INDEX IF NOT EXISTS idx_shop_orders_pix_txid ON shop_orders(pix_txid) WHERE pix_txid IS NOT NULL;

-- Transações PIX
CREATE TABLE IF NOT EXISTS pix_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE,
  txid TEXT NOT NULL UNIQUE,
  pix_key TEXT NOT NULL,
  amount_cents INT NOT NULL CHECK (amount_cents > 0),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  payload TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pix_transactions_order ON pix_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_pix_transactions_status ON pix_transactions(status);
CREATE INDEX IF NOT EXISTS idx_pix_transactions_txid ON pix_transactions(txid);

ALTER TABLE pix_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pix tx buyer or store owner" ON pix_transactions;
CREATE POLICY "Pix tx buyer or store owner" ON pix_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM shop_orders o
      WHERE o.id = order_id
        AND (
          o.buyer_id = auth.uid()::text
          OR EXISTS (SELECT 1 FROM stores s WHERE s.id = o.store_id AND s.owner_id = auth.uid()::text)
        )
    )
  );
