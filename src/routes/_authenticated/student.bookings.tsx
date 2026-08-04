import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Loader2, Star, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { studentNav } from "@/components/dashboard/nav-items";
import { EmptyState } from "@/components/empty-state";
import { StarRating } from "@/components/star-rating";
import { StatusBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { initials } from "@/hooks/use-current-user";
import { useRoleGuard } from "@/hooks/use-role-guard";
import {
import { avatarSrc } from "@/lib/avatar";
  cancelBooking,
  cleanDbError,
  formatDate,
  formatTime,
  studentBookingsQuery,
  type StudentBooking,
} from "@/lib/data";

export const Route = createFileRoute("/_authenticated/student/bookings")({
  head: () => ({
    meta: [
      { title: "My Bookings — MentorLoop" },
      { name: "description", content: "Manage your mentoring sessions and leave reviews after each session." },
      { property: "og:title", content: "My Bookings — MentorLoop" },
      { property: "og:description", content: "Your upcoming and past mentoring sessions." },
    ],
  }),
  component: StudentBookings,
});

function StudentBookings() {
  const { data: user } = useRoleGuard("student");
  const bookings = useQuery(studentBookingsQuery(user?.id));
  const queryClient = useQueryClient();
  const [reviewFor, setReviewFor] = useState<StudentBooking | null>(null);
  const [rating, setRating] = useState(5);
  const [note, setNote] = useState("");

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["student-bookings"] });
    void queryClient.invalidateQueries({ queryKey: ["available-slots"] });
    void queryClient.invalidateQueries({ queryKey: ["mentor-directory"] });
  }

  const cancel = useMutation({
    mutationFn: cancelBooking,
    onSuccess: () => {
      toast.success("Booking cancelled");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!reviewFor || !user) throw new Error("Nothing to review.");
      const { error } = await supabase.from("reviews").insert({
        booking_id: reviewFor.id,
        mentor_id: reviewFor.mentor_id,
        student_id: user.id,
        rating,
        review: note,
      });
      if (error) throw new Error(cleanDbError(error.message));
    },
    onSuccess: () => {
      toast.success("Thanks for the review!");
      setReviewFor(null);
      setNote("");
      setRating(5);
      invalidate();
      void queryClient.invalidateQueries({ queryKey: ["student-reviews"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const all = bookings.data ?? [];
  const groups = {
    upcoming: all.filter((b) => b.status === "BOOKED"),
    completed: all.filter((b) => b.status === "COMPLETED"),
    other: all.filter((b) => b.status === "CANCELLED" || b.status === "EXPIRED"),
  };

  return (
    <DashboardLayout items={studentNav} title="My bookings" subtitle="Sessions you've booked with mentors">
      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({groups.upcoming.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({groups.completed.length})</TabsTrigger>
          <TabsTrigger value="other">Cancelled / Expired ({groups.other.length})</TabsTrigger>
        </TabsList>

        {(["upcoming", "completed", "other"] as const).map((key) => (
          <TabsContent key={key} value={key} className="mt-5 space-y-3">
            {bookings.isLoading ? (
              [0, 1, 2].map((i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)
            ) : groups[key].length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="Nothing here yet"
                description="Book a slot with a mentor and it will show up in this list."
              />
            ) : (
              groups[key].map((booking) => (
                <Card key={booking.id} className="card-surface animate-fade-up border-0">
                  <CardContent className="flex flex-wrap items-center gap-4 p-5">
                    <Avatar className="size-11">
                      <AvatarImage src={avatarSrc(booking.mentor?.profile?.avatar)} alt="" />
                      <AvatarFallback>{initials(booking.mentor?.profile?.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{booking.mentor?.profile?.name || "Mentor"}</p>
                        <StatusBadge status={booking.status} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(booking.slot.date)} · {formatTime(booking.slot.start_time)} –{" "}
                        {formatTime(booking.slot.end_time)}
                      </p>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        Meeting ID: {booking.meeting_id}
                      </p>
                    </div>
                    {booking.status === "BOOKED" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancel.mutate(booking.id)}
                        disabled={cancel.isPending}
                      >
                        {cancel.isPending ? <Loader2 className="animate-spin" /> : <XCircle />} Cancel
                      </Button>
                    ) : null}
                    {booking.status === "COMPLETED" ? (
                      booking.reviews ? (
                        <StarRating value={booking.reviews.rating} size="sm" />
                      ) : (
                        <Button size="sm" variant="hero" onClick={() => setReviewFor(booking)}>
                          <Star /> Leave review
                        </Button>
                      )
                    ) : null}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={!!reviewFor} onOpenChange={(open) => !open && setReviewFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate your session</DialogTitle>
            <DialogDescription>
              How was your session with {reviewFor?.mentor?.profile?.name || "your mentor"}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <StarRating value={rating} onChange={setRating} size="lg" />
            <Textarea
              rows={4}
              placeholder="Share what went well (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReviewFor(null)}>
              Cancel
            </Button>
            <Button variant="hero" onClick={() => submitReview.mutate()} disabled={submitReview.isPending}>
              {submitReview.isPending ? <Loader2 className="animate-spin" /> : null} Submit review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>

  );
}
