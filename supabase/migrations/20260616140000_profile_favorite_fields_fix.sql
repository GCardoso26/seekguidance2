-- Garante colunas de perfil para TCGs favoritos e amplia favorite_game para slugs longos

SET search_path TO tcg_judge, public;

ALTER TABLE player_profiles
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS state VARCHAR(2),
  ADD COLUMN IF NOT EXISTS favorite_tcgs TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE player_profiles
  ALTER COLUMN favorite_game TYPE VARCHAR(32);
