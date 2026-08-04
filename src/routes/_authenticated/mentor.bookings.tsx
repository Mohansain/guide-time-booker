import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { mentorNav } from "@/components/dashboard/nav-items";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { initials } from "@/hooks/use-current-user";
import { useRoleGuard } from "@/hooks/use-role-guard";
import { avatarSrc } from "@/lib/avatar";
import {
  cancelBooking,
  completeBooking,
  formatDate,
  formatTime,
  mentorBookingsQuery,
  type MentorBooking,
} from "@/lib/data";

export const Route = createFileRoute("/_authenticated/mentor/bookings")({
  head: () => ({
    meta: [
      { title: "Mentor Bookings — MentorLoop" },
      { name: "description", content: "Review, complete or cancel the sessions students booked with you." },
      { property: "og:title", content: "Mentor Bookings — MentorLoop" },
      { property: "og:description", content: "Manage every session booked with you." },
    ],
  }),
  component: MentorBookings,
});

function MentorBookings() {
  const { data: user } = useRoleGuard("mentor");
  const bookings = useQuery(mentorBookingsQuery(user?.mentor?.id));
  const queryClient = useQueryClient();

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["mentor-bookings"] });
    void queryClient.invalidateQueries({ queryKey: ["mentor-slots"] });
    void queryClient.invalidateQueries({ queryKey: ["available-slots"] });
  }

  const complete = useMutation({
    mutationFn: completeBooking,
    onSuccess: () => {
      toast.success("Session marked as completed");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const cancel = useMutation({
    mutationFn: cancelBooking,
    onSuccess: () => {
      toast.success("Session cancelled");
      invalidate();
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
    <DashboardLayout items={mentorNav} title="Bookings" subtitle="Every session students booked with you">
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
                description="Sessions will appear here as students book your published slots."
              />
            ) : (
              groups[key].map((booking) => (
                <BookingRow
                  key={booking.id}
                  booking={booking}
                  onComplete={() => complete.mutate(booking.id)}
                  onCancel={() => cancel.mutate(booking.id)}
                  busy={complete.isPending || cancel.isPending}
                />
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </DashboardLayout>
  );
}

function BookingRow({
  booking,
  onComplete,
  onCancel,
  busy,
}: {
  booking: MentorBooking;
  onComplete: () => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const actionable = booking.status === "BOOKED";

  return (
    <Card className="card-surface animate-fade-up border-0">
      <CardContent className="flex flex-wrap items-center gap-4 p-5">
        <Avatar className="size-11">
          <AvatarImage src={avatarSrc(booking.student?.avatar)} alt="" />
          <AvatarFallback>{initials(booking.student?.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{booking.student?.name || "Student"}</p>
            <StatusBadge status={booking.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {formatDate(booking.slot.date)} · {formatTime(booking.slot.start_time)} –{" "}
            {formatTime(booking.slot.end_time)}
          </p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">Meeting ID: {booking.meeting_id}</p>
        </div>
        {actionable ? (
          <div className="flex gap-2">
            <Button size="sm" variant="hero" onClick={onComplete} disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} Complete
            </Button>
            <Button size="sm" variant="outline" onClick={onCancel} disabled={busy}>
              <XCircle /> Cancel
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
