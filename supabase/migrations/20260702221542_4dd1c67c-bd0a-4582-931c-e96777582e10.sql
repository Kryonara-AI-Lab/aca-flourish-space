
-- Extend profiles with bio for the new profile page
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS honor_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active_date date;

-- Account activity log (login, 2FA change, break, password change)
CREATE TABLE IF NOT EXISTS public.account_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  detail text,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.account_events TO authenticated;
GRANT ALL ON public.account_events TO service_role;

ALTER TABLE public.account_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own events"
  ON public.account_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own events"
  ON public.account_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Award honor score + bump streak (called from client after a study or exam action)
CREATE OR REPLACE FUNCTION public.award_honor(_points integer, _activity_type text DEFAULT 'study')
RETURNS TABLE(honor_score integer, current_streak integer, longest_streak integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _today date := (now() at time zone 'utc')::date;
  _last date;
  _new_streak integer;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Cap points at reasonable per-call max (hard-to-farm)
  _points := GREATEST(0, LEAST(_points, 100));

  SELECT p.last_active_date INTO _last FROM public.profiles p WHERE p.id = _uid;

  IF _last IS NULL OR _last < _today - INTERVAL '1 day' THEN
    _new_streak := 1;
  ELSIF _last = _today - INTERVAL '1 day' THEN
    SELECT current_streak + 1 INTO _new_streak FROM public.profiles WHERE id = _uid;
  ELSE
    SELECT current_streak INTO _new_streak FROM public.profiles WHERE id = _uid;
  END IF;

  UPDATE public.profiles
     SET honor_score    = LEAST(10000, COALESCE(honor_score, 0) + _points),
         current_streak = _new_streak,
         longest_streak = GREATEST(COALESCE(longest_streak, 0), _new_streak),
         last_active_date = _today
   WHERE id = _uid
   RETURNING profiles.honor_score, profiles.current_streak, profiles.longest_streak
        INTO honor_score, current_streak, longest_streak;

  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.award_honor(integer, text) TO authenticated;
