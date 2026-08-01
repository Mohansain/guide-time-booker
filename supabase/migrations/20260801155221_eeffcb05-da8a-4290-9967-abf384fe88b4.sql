-- Enums
CREATE TYPE public.app_role AS ENUM ('mentor', 'student', 'admin');
CREATE TYPE public.slot_status AS ENUM ('AVAILABLE', 'BOOKED', 'CANCELLED', 'COMPLETED', 'EXPIRED');
CREATE TYPE public.booking_status AS ENUM ('BOOKED', 'CANCELLED', 'COMPLETED', 'EXPIRED');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  avatar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can claim own role" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND role <> 'admin');

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- Mentors
CREATE TABLE public.mentors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  bio TEXT NOT NULL DEFAULT '',
  specialization TEXT NOT NULL DEFAULT '',
  experience INTEGER NOT NULL DEFAULT 0,
  rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  total_reviews INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.mentors TO authenticated;
GRANT SELECT ON public.mentors TO anon;
GRANT ALL ON public.mentors TO service_role;
ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mentors are viewable by everyone" ON public.mentors FOR SELECT USING (true);
CREATE POLICY "Mentors can create own profile" ON public.mentors FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = profile_id AND public.has_role(auth.uid(), 'mentor'));
CREATE POLICY "Mentors can update own profile" ON public.mentors FOR UPDATE TO authenticated
  USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);

-- Slots
CREATE TABLE public.slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status public.slot_status NOT NULL DEFAULT 'AVAILABLE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX slots_mentor_idx ON public.slots(mentor_id);
CREATE INDEX slots_date_idx ON public.slots(date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.slots TO authenticated;
GRANT SELECT ON public.slots TO anon;
GRANT ALL ON public.slots TO service_role;
ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Slots are viewable by everyone" ON public.slots FOR SELECT USING (true);
CREATE POLICY "Mentors manage own slots insert" ON public.slots FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.mentors m WHERE m.id = mentor_id AND m.profile_id = auth.uid()));
CREATE POLICY "Mentors manage own slots update" ON public.slots FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mentors m WHERE m.id = mentor_id AND m.profile_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.mentors m WHERE m.id = mentor_id AND m.profile_id = auth.uid()));
CREATE POLICY "Mentors manage own slots delete" ON public.slots FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mentors m WHERE m.id = mentor_id AND m.profile_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.validate_slot() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.end_time <= NEW.start_time THEN
    RAISE EXCEPTION 'End time must be after start time';
  END IF;
  IF TG_OP = 'INSERT' AND (NEW.date + NEW.start_time) < (now() AT TIME ZONE 'utc') THEN
    RAISE EXCEPTION 'Cannot create a slot in the past';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER validate_slot_trg BEFORE INSERT OR UPDATE ON public.slots
FOR EACH ROW EXECUTE FUNCTION public.validate_slot();

-- Bookings
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID NOT NULL REFERENCES public.slots(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
  status public.booking_status NOT NULL DEFAULT 'BOOKED',
  meeting_id TEXT NOT NULL DEFAULT ('MTR-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  booked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX bookings_active_slot_idx ON public.bookings(slot_id) WHERE status <> 'CANCELLED';
CREATE INDEX bookings_student_idx ON public.bookings(student_id);
CREATE INDEX bookings_mentor_idx ON public.bookings(mentor_id);
GRANT SELECT, UPDATE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students see own bookings" ON public.bookings FOR SELECT TO authenticated
  USING (student_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.mentors m WHERE m.id = mentor_id AND m.profile_id = auth.uid()));

-- Reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX reviews_mentor_idx ON public.reviews(mentor_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT SELECT ON public.reviews TO anon;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Students review own completed bookings" ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_id AND b.student_id = auth.uid() AND b.status = 'COMPLETED' AND b.mentor_id = reviews.mentor_id
  ));
CREATE POLICY "Students update own reviews" ON public.reviews FOR UPDATE TO authenticated
  USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
CREATE POLICY "Owners or admins delete reviews" ON public.reviews FOR DELETE TO authenticated
  USING (student_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Mentor rating aggregation
CREATE OR REPLACE FUNCTION public.refresh_mentor_rating() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE target UUID := COALESCE(NEW.mentor_id, OLD.mentor_id);
BEGIN
  UPDATE public.mentors m SET
    rating = COALESCE((SELECT ROUND(AVG(r.rating)::numeric, 2) FROM public.reviews r WHERE r.mentor_id = target), 0),
    total_reviews = (SELECT COUNT(*) FROM public.reviews r WHERE r.mentor_id = target)
  WHERE m.id = target;
  RETURN NULL;
END;
$$;
CREATE TRIGGER refresh_mentor_rating_trg AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.refresh_mentor_rating();

-- New user bootstrap
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE chosen public.app_role;
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.email, ''),
    NEW.raw_user_meta_data->>'avatar_url'
  ) ON CONFLICT (id) DO NOTHING;

  chosen := CASE WHEN NEW.raw_user_meta_data->>'role' = 'mentor' THEN 'mentor'::public.app_role ELSE 'student'::public.app_role END;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, chosen) ON CONFLICT DO NOTHING;

  IF chosen = 'mentor' THEN
    INSERT INTO public.mentors (profile_id, specialization, bio)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'specialization', ''), COALESCE(NEW.raw_user_meta_data->>'bio', ''))
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Expire stale slots/bookings
CREATE OR REPLACE FUNCTION public.expire_stale_sessions() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.bookings b SET status = 'EXPIRED'
  WHERE b.status = 'BOOKED'
    AND EXISTS (SELECT 1 FROM public.slots s WHERE s.id = b.slot_id AND (s.date + s.end_time) < (now() AT TIME ZONE 'utc'));

  UPDATE public.slots s SET status = 'EXPIRED'
  WHERE s.status IN ('AVAILABLE', 'BOOKED')
    AND (s.date + s.end_time) < (now() AT TIME ZONE 'utc');
END;
$$;
GRANT EXECUTE ON FUNCTION public.expire_stale_sessions() TO anon, authenticated, service_role;

-- Race-safe booking
CREATE OR REPLACE FUNCTION public.book_slot(_slot_id UUID) RETURNS public.bookings
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.slots; b public.bookings; uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'You must be signed in to book.'; END IF;
  IF NOT public.has_role(uid, 'student') THEN RAISE EXCEPTION 'Only students can book sessions.'; END IF;

  SELECT * INTO s FROM public.slots WHERE id = _slot_id FOR UPDATE;
  IF s.id IS NULL THEN RAISE EXCEPTION 'Slot not found.'; END IF;
  IF (s.date + s.start_time) < (now() AT TIME ZONE 'utc') THEN RAISE EXCEPTION 'This slot is in the past.'; END IF;
  IF s.status <> 'AVAILABLE' THEN RAISE EXCEPTION 'This slot has already been booked.'; END IF;
  IF EXISTS (SELECT 1 FROM public.bookings x WHERE x.slot_id = _slot_id AND x.status <> 'CANCELLED') THEN
    RAISE EXCEPTION 'This slot has already been booked.';
  END IF;

  INSERT INTO public.bookings (slot_id, student_id, mentor_id) VALUES (_slot_id, uid, s.mentor_id) RETURNING * INTO b;
  UPDATE public.slots SET status = 'BOOKED' WHERE id = _slot_id;
  RETURN b;
EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'This slot has already been booked.';
END;
$$;
GRANT EXECUTE ON FUNCTION public.book_slot(UUID) TO authenticated;

-- Cancel booking (student or owning mentor)
CREATE OR REPLACE FUNCTION public.cancel_booking(_booking_id UUID) RETURNS public.bookings
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE b public.bookings; uid UUID := auth.uid(); is_mentor BOOLEAN;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'You must be signed in.'; END IF;
  SELECT * INTO b FROM public.bookings WHERE id = _booking_id FOR UPDATE;
  IF b.id IS NULL THEN RAISE EXCEPTION 'Booking not found.'; END IF;
  SELECT EXISTS (SELECT 1 FROM public.mentors m WHERE m.id = b.mentor_id AND m.profile_id = uid) INTO is_mentor;
  IF b.student_id <> uid AND NOT is_mentor THEN RAISE EXCEPTION 'You cannot cancel this booking.'; END IF;
  IF b.status = 'COMPLETED' THEN RAISE EXCEPTION 'Completed sessions cannot be cancelled.'; END IF;
  IF b.status = 'CANCELLED' THEN RAISE EXCEPTION 'This booking is already cancelled.'; END IF;

  UPDATE public.bookings SET status = 'CANCELLED', cancelled_at = now() WHERE id = _booking_id RETURNING * INTO b;
  UPDATE public.slots SET status = CASE
      WHEN (date + start_time) < (now() AT TIME ZONE 'utc') THEN 'EXPIRED'::public.slot_status
      ELSE 'AVAILABLE'::public.slot_status END
  WHERE id = b.slot_id;
  RETURN b;
END;
$$;
GRANT EXECUTE ON FUNCTION public.cancel_booking(UUID) TO authenticated;

-- Complete booking (owning mentor only)
CREATE OR REPLACE FUNCTION public.complete_booking(_booking_id UUID) RETURNS public.bookings
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE b public.bookings; uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'You must be signed in.'; END IF;
  SELECT * INTO b FROM public.bookings WHERE id = _booking_id FOR UPDATE;
  IF b.id IS NULL THEN RAISE EXCEPTION 'Booking not found.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.mentors m WHERE m.id = b.mentor_id AND m.profile_id = uid) THEN
    RAISE EXCEPTION 'Only the session mentor can complete this session.';
  END IF;
  IF b.status = 'CANCELLED' THEN RAISE EXCEPTION 'Cancelled sessions cannot be completed.'; END IF;
  IF b.status = 'COMPLETED' THEN RAISE EXCEPTION 'This session is already completed.'; END IF;

  UPDATE public.bookings SET status = 'COMPLETED', completed_at = now() WHERE id = _booking_id RETURNING * INTO b;
  UPDATE public.slots SET status = 'COMPLETED' WHERE id = b.slot_id;
  RETURN b;
END;
$$;
GRANT EXECUTE ON FUNCTION public.complete_booking(UUID) TO authenticated;