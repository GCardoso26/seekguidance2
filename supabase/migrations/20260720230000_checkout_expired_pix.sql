-- Checkout V2: session status expired + payment method metadata for PIX.
ALTER TABLE checkout.sessions
  DROP CONSTRAINT IF EXISTS sessions_status_check;

ALTER TABLE checkout.sessions
  ADD CONSTRAINT sessions_status_check
  CHECK (status IN (
    'created', 'validating', 'reserved', 'priced', 'payment_pending',
    'completed', 'failed', 'cancelled', 'expired'
  ));

ALTER TABLE checkout.payment_intents
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS pix_qr_code text,
  ADD COLUMN IF NOT EXISTS pix_copy_paste text,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;
