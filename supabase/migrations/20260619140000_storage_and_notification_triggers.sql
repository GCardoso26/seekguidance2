-- Storage bucket community-images + triggers de notificação

SET search_path TO tcg_judge, public, storage;

-- Bucket público para imagens de posts
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-images',
  'community-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Community images public read" ON storage.objects;
CREATE POLICY "Community images public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'community-images');

DROP POLICY IF EXISTS "Authenticated upload community images" ON storage.objects;
CREATE POLICY "Authenticated upload community images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'community-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users update own community images" ON storage.objects;
CREATE POLICY "Users update own community images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'community-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users delete own community images" ON storage.objects;
CREATE POLICY "Users delete own community images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'community-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Notificação: novo comentário no post (exceto autor comentando no próprio post)
CREATE OR REPLACE FUNCTION tcg_judge.notify_post_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = tcg_judge, public
AS $$
DECLARE
  post_author TEXT;
  post_title TEXT;
  post_community UUID;
BEGIN
  SELECT author_id, title, community_id
    INTO post_author, post_title, post_community
    FROM tcg_judge.community_posts
   WHERE id = NEW.post_id;

  IF post_author IS NULL OR post_author = NEW.author_id THEN
    RETURN NEW;
  END IF;

  INSERT INTO tcg_judge.notifications (user_id, type, title, content, link)
  VALUES (
    post_author,
    'post_reply',
    'Novo comentário no seu post',
    'Alguém comentou em "' || LEFT(post_title, 80) || '"',
    '/social/communities/' || post_community::text || '/posts/' || NEW.post_id::text
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS post_reply_notification ON tcg_judge.post_comments;
CREATE TRIGGER post_reply_notification
  AFTER INSERT ON tcg_judge.post_comments
  FOR EACH ROW EXECUTE FUNCTION tcg_judge.notify_post_reply();

-- Notificação: solicitação de amizade
CREATE OR REPLACE FUNCTION tcg_judge.notify_friend_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = tcg_judge, public
AS $$
BEGIN
  IF NEW.status <> 'pending' THEN
    RETURN NEW;
  END IF;

  INSERT INTO tcg_judge.notifications (user_id, type, title, content, link)
  VALUES (
    NEW.addressee_id,
    'friend_request',
    'Nova solicitação de amizade',
    'Alguém quer ser seu amigo.',
    '/social/friends'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS friend_request_notification ON tcg_judge.friendships;
CREATE TRIGGER friend_request_notification
  AFTER INSERT ON tcg_judge.friendships
  FOR EACH ROW EXECUTE FUNCTION tcg_judge.notify_friend_request();

-- Notificação: nova mensagem direta
CREATE OR REPLACE FUNCTION tcg_judge.notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = tcg_judge, public
AS $$
BEGIN
  INSERT INTO tcg_judge.notifications (user_id, type, title, content, link)
  VALUES (
    NEW.receiver_id,
    'new_message',
    'Nova mensagem',
    LEFT(NEW.content, 120),
    '/social/messages/' || NEW.sender_id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS new_message_notification ON tcg_judge.social_messages;
CREATE TRIGGER new_message_notification
  AFTER INSERT ON tcg_judge.social_messages
  FOR EACH ROW EXECUTE FUNCTION tcg_judge.notify_new_message();
