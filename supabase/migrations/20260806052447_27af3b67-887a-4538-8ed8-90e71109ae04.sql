-- 1) Restrict profiles reads to signed-in users only
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);

REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- 2) Safe public mentor directory (no emails)
CREATE OR REPLACE VIEW public.public_mentors
WITH (security_invoker = off) AS
  SELECT m.id,
         m.profile_id,
         m.specialization,
         m.bio,
         m.experience,
         m.rating,
         m.total_reviews,
         m.created_at,
         p.name,
         p.avatar
  FROM public.mentors m
  JOIN public.profiles p ON p.id = m.profile_id;

GRANT SELECT ON public.public_mentors TO anon, authenticated;

-- 3) Lock down SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.book_slot(uuid) FROM anon, public;
REVOKE ALL ON FUNCTION public.cancel_booking(uuid) FROM anon, public;
REVOKE ALL ON FUNCTION public.complete_booking(uuid) FROM anon, public;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
REVOKE ALL ON FUNCTION public.expire_stale_sessions() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.refresh_mentor_rating() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.validate_slot() FROM anon, authenticated, public;

GRANT EXECUTE ON FUNCTION public.book_slot(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_booking(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_booking(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_stale_sessions() TO service_role;