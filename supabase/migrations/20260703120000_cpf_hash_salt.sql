-- CPF hash v2: HMAC-SHA256 com salt (CPF_SALT env) — invalida hashes SHA-256 legados

SET search_path TO tcg_judge, public;

ALTER TABLE player_profiles
  ADD COLUMN IF NOT EXISTS cpf_hash_version SMALLINT NOT NULL DEFAULT 2;

-- Sem o CPF em texto plano não é possível re-hash; usuários com CPF v1 devem revalidar
UPDATE player_profiles
SET account_status = 'pending_cpf',
    cpf_hash = NULL,
    cpf_last4 = NULL,
    cpf_verified_at = NULL,
    cpf_hash_version = 2,
    updated_at = NOW()
WHERE cpf_hash IS NOT NULL;

COMMENT ON COLUMN player_profiles.cpf_hash_version IS '2 = HMAC-SHA256 com CPF_SALT';
