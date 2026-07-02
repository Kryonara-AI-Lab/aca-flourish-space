
CREATE OR REPLACE FUNCTION public.award_honor(_points integer, _activity_type text DEFAULT 'study')
RETURNS TABLE(honor_score integer, current_streak integer, longest_streak integer)
LANGUAGE plpgsql
SECURITY INVOKER
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
