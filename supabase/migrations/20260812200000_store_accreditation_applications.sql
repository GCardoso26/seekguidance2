-- Fase 2: pedidos de credenciamento Hobby Store (ADR-018)
SET search_path TO tcg_judge, public;

CREATE SEQUENCE IF NOT EXISTS store_accreditation_protocol_seq START 1;

CREATE TABLE IF NOT EXISTS store_accreditation_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol VARCHAR(32),
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  applicant_user_id TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'draft'
    CHECK (status IN (
      'draft',
      'submitted',
      'under_review',
      'approved',
      'rejected'
    )),
  cnpj VARCHAR(18),
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  current_step INT NOT NULL DEFAULT 1 CHECK (current_step BETWEEN 1 AND 8),
  trust_score_initial INT NOT NULL DEFAULT 0 CHECK (trust_score_initial BETWEEN 0 AND 100),
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_accreditation_protocol
  ON store_accreditation_applications (protocol)
  WHERE protocol IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_accreditation_applicant
  ON store_accreditation_applications (applicant_user_id);

CREATE INDEX IF NOT EXISTS idx_accreditation_status
  ON store_accreditation_applications (status);

CREATE INDEX IF NOT EXISTS idx_accreditation_cnpj
  ON store_accreditation_applications (cnpj)
  WHERE cnpj IS NOT NULL;

-- Um rascunho/em análise aberto por applicant (aprovado/rejeitado podem reabrir).
CREATE UNIQUE INDEX IF NOT EXISTS uq_accreditation_open_per_user
  ON store_accreditation_applications (applicant_user_id)
  WHERE status IN ('draft', 'submitted', 'under_review');

COMMENT ON TABLE store_accreditation_applications IS
  'Pedidos de credenciamento Hobby Store; store_id preenchido na aprovação';
COMMENT ON COLUMN store_accreditation_applications.protocol IS
  'Protocolo público #JTCG-NNNNNN emitido no submit';
COMMENT ON COLUMN store_accreditation_applications.answers IS
  'JSON multi-step: store, cnpj_lookup, responsible, profile, evidence, operations, agreements';
