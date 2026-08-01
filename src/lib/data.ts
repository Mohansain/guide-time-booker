import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;
export type Mentor = Tables<"mentors">;
export type Slot = Tables<"slots">;
export type Booking = Tables<"bookings">;
export type Review = Tables<"reviews">;

export type MentorWithProfile = Mentor & { profile: Profile };
export type SlotWithMentor = Slot & { mentor: MentorWithProfile };
export type MentorBooking = Booking & { slot: Slot; student: Profile };
export type StudentBooking = Booking & {
  slot: Slot;
  mentor: MentorWithProfile;
  reviews: { id: string; rating: number; review: string } | null;
};
export type ReviewWithStudent = Review & { student: Profile };

function unwrap<T>(res: { data: unknown; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export function formatTime(time: string) {
  const [h, m] = time.split(":");
  const hour = Number(h);
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${m} ${suffix}`;
}

export function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function slotStart(slot: Pick<Slot, "date" | "start_time">) {
  return new Date(`${slot.date}T${slot.start_time}`);
}

export async function expireStaleSessions() {
  await supabase.rpc("expire_stale_sessions");
}

/* ---------------- Mentor side ---------------- */

export const mentorSlotsQuery = (mentorId: string | undefined) =>
  queryOptions({
    queryKey: ["mentor-slots", mentorId],
    enabled: !!mentorId,
    queryFn: async () =>
      unwrap<Slot[]>(
        await supabase
          .from("slots")
          .select("*")
          .eq("mentor_id", mentorId!)
          .order("date", { ascending: true })
          .order("start_time", { ascending: true }),
      ),
  });

export const mentorBookingsQuery = (mentorId: string | undefined) =>
  queryOptions({
    queryKey: ["mentor-bookings", mentorId],
    enabled: !!mentorId,
    queryFn: async () =>
      unwrap<MentorBooking[]>(
        await supabase
          .from("bookings")
          .select("*, slot:slots(*), student:profiles!bookings_student_id_fkey(*)")
          .eq("mentor_id", mentorId!)
          .order("booked_at", { ascending: false }),
      ),
  });

export const mentorReviewsQuery = (mentorId: string | undefined) =>
  queryOptions({
    queryKey: ["mentor-reviews", mentorId],
    enabled: !!mentorId,
    queryFn: async () =>
      unwrap<ReviewWithStudent[]>(
        await supabase
          .from("reviews")
          .select("*, student:profiles!reviews_student_id_fkey(*)")
          .eq("mentor_id", mentorId!)
          .order("created_at", { ascending: false }),
      ),
  });

/* ---------------- Student side ---------------- */

export const availableSlotsQuery = () =>
  queryOptions({
    queryKey: ["available-slots"],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      return unwrap<SlotWithMentor[]>(
        await supabase
          .from("slots")
          .select("*, mentor:mentors(*, profile:profiles(*))")
          .eq("status", "AVAILABLE")
          .gte("date", today)
          .order("date", { ascending: true })
          .order("start_time", { ascending: true }),
      );
    },
  });

export const mentorDirectoryQuery = () =>
  queryOptions({
    queryKey: ["mentor-directory"],
    queryFn: async () =>
      unwrap<MentorWithProfile[]>(
        await supabase
          .from("mentors")
          .select("*, profile:profiles(*)")
          .order("rating", { ascending: false }),
      ),
  });

export const studentBookingsQuery = (studentId: string | undefined) =>
  queryOptions({
    queryKey: ["student-bookings", studentId],
    enabled: !!studentId,
    queryFn: async () =>
      unwrap<StudentBooking[]>(
        await supabase
          .from("bookings")
          .select(
            "*, slot:slots(*), mentor:mentors(*, profile:profiles(*)), reviews(id, rating, review)",
          )
          .eq("student_id", studentId!)
          .order("booked_at", { ascending: false }),
      ),
  });

export const studentReviewsQuery = (studentId: string | undefined) =>
  queryOptions({
    queryKey: ["student-reviews", studentId],
    enabled: !!studentId,
    queryFn: async () =>
      unwrap<(Review & { mentor: MentorWithProfile })[]>(
        await supabase
          .from("reviews")
          .select("*, mentor:mentors(*, profile:profiles(*))")
          .eq("student_id", studentId!)
          .order("created_at", { ascending: false }),
      ),
  });

/* ---------------- Public landing stats ---------------- */

export const publicTopMentorsQuery = () =>
  queryOptions({
    queryKey: ["public-top-mentors"],
    queryFn: async () =>
      unwrap<MentorWithProfile[]>(
        await supabase
          .from("mentors")
          .select("*, profile:profiles(*)")
          .order("rating", { ascending: false })
          .limit(3),
      ),
  });

/* ---------------- Mutations ---------------- */

export async function bookSlot(slotId: string) {
  const { error } = await supabase.rpc("book_slot", { _slot_id: slotId });
  if (error) throw new Error(cleanDbError(error.message));
}

export async function cancelBooking(bookingId: string) {
  const { error } = await supabase.rpc("cancel_booking", { _booking_id: bookingId });
  if (error) throw new Error(cleanDbError(error.message));
}

export async function completeBooking(bookingId: string) {
  const { error } = await supabase.rpc("complete_booking", { _booking_id: bookingId });
  if (error) throw new Error(cleanDbError(error.message));
}

export function cleanDbError(message: string) {
  return message.replace(/^.*?(?:ERROR:|error:)\s*/i, "").trim() || "Something went wrong.";
}
