DROP VIEW IF EXISTS public.public_mentors;

-- Anonymous visitors may read only non-sensitive profile columns
CREATE POLICY "Public can view basic profile info"
  ON public.profiles FOR SELECT TO anon USING (true);

GRANT SELECT (id, name, avatar, created_at) ON public.profiles TO anon;