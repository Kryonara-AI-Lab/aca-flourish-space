
-- Add username to profiles for Lumio social
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text UNIQUE;
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles (lower(username));

-- Posts
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  material_id uuid REFERENCES public.materials(id) ON DELETE SET NULL,
  poll jsonb,
  attachment jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view posts" ON public.posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own posts" ON public.posts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own posts" ON public.posts FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER posts_touch BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX posts_created_idx ON public.posts (created_at DESC);
CREATE INDEX posts_user_idx ON public.posts (user_id);

-- Comments
CREATE TABLE public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.post_comments TO authenticated;
GRANT ALL ON public.post_comments TO service_role;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view comments" ON public.post_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own comments" ON public.post_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own comments" ON public.post_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX post_comments_post_idx ON public.post_comments (post_id, created_at);

-- Likes
CREATE TABLE public.post_likes (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.post_likes TO authenticated;
GRANT ALL ON public.post_likes TO service_role;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view likes" ON public.post_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users like as self" ON public.post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users unlike own" ON public.post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Reports
CREATE TABLE public.post_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);
GRANT SELECT, INSERT ON public.post_reports TO authenticated;
GRANT ALL ON public.post_reports TO service_role;
ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own reports" ON public.post_reports FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own reports" ON public.post_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to see basic profile info of others (for feed authorship)
CREATE POLICY "Authenticated view public profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
