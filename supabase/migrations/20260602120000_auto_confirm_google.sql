-- Auto-confirmar email para utilizadores Google OAuth (Judge TCG v3)
-- Aplicar no projeto Supabase ligado ao frontend.

CREATE OR REPLACE FUNCTION public.handle_new_user_google_confirm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.raw_app_meta_data->>'provider' = 'google'
     OR NEW.raw_user_meta_data->>'iss' LIKE '%google%' THEN
    NEW.email_confirmed_at := COALESCE(NEW.email_confirmed_at, NOW());
    NEW.raw_user_meta_data := jsonb_set(
      COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
      '{email_verified}',
      'true'::jsonb
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_google_confirm ON auth.users;
CREATE TRIGGER on_auth_user_created_google_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_google_confirm();
