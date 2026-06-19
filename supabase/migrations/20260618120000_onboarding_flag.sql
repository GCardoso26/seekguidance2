-- Flag de onboarding concluído (escolha de 5 TCGs favoritos no plano Free)

SET search_path TO tcg_judge, public;

ALTER TABLE player_profiles
  ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN NOT NULL DEFAULT false;
