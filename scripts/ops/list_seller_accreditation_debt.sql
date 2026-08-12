-- Relatório ops: lojas em grandfather / sem CNPJ / free (ADR-018)
-- psql $DATABASE_URL -f scripts/ops/list_seller_accreditation_debt.sql

SET search_path TO tcg_judge, public;

SELECT
  id,
  name,
  slug,
  cnpj,
  subscription_plan,
  accreditation_status,
  accreditation_deadline_at,
  CASE
    WHEN accreditation_deadline_at IS NULL THEN NULL
    ELSE EXTRACT(DAY FROM (accreditation_deadline_at - NOW()))::int
  END AS days_remaining,
  created_at
FROM stores
WHERE
  accreditation_status = 'grandfathered'
  OR accreditation_status IN ('pending', 'submitted', 'under_review')
  OR subscription_plan IN ('free', 'pending_accreditation')
  OR cnpj IS NULL
  OR BTRIM(cnpj) = ''
ORDER BY accreditation_deadline_at NULLS LAST, created_at ASC;
