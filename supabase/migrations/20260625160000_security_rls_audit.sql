-- Auditoria de segurança: RLS em card_catalog (leitura pública; escrita via service role)

SET search_path TO tcg_judge, public;

ALTER TABLE card_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "card_catalog_select_public" ON card_catalog;
CREATE POLICY "card_catalog_select_public"
  ON card_catalog FOR SELECT
  USING (true);

COMMENT ON TABLE card_catalog IS 'RLS: SELECT público; INSERT/UPDATE apenas service role (sync de catálogo).';
