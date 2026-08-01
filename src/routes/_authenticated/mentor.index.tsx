import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, CalendarDays, CheckCircle2, Star, XCircle } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { mentorNav } from "@/components/dashboard/nav-items";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/empty-state";
import { StarRating } from "@/components/star-rating";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoleGuard } from "@/hooks/use-role-guard";
import {
  expireStaleSessions,
  formatDate,
  formatTime,
  mentorBookingsQuery,
  mentorReviewsQuery,
  mentorSlotsQuery,
} from "@/lib/data";

export const Route = createFileRoute("/_authenticated/mentor/")({
  head: () => ({
    meta: [
      { title: "Mentor Dashboard — MentorLoop" },
      { name: "description", content: "Track your mentoring sessions, availability and reviews." },
      { property: "og:title", content: "Mentor Dashboard — MentorLoop" },
      { property: "og:description", content: "Track sessions, availability and student reviews." },
    ],
  }),
  component: MentorDashboard,
});

function MentorDashboard() {
  const { data: user } = useRoleGuard("mentor");
  const mentorId = user?.mentor?.id;

  useEffect(() => {
    void expireStaleSessions();
  }, []);

  const bookings = useQuery(mentorBookingsQuery(mentorId));
  const slots = useQuery(mentorSlotsQuery(mentorId));
  const reviews = useQuery(mentorReviewsQuery(mentorId));

  const all = bookings.data ?? [];
  const upcoming = all.filter((b) => b.status === "BOOKED");
  const completed = all.filter((b) => b.status === "COMPLETED");
  const cancelled = all.filter((b) => b.status === "CANCELLED");
  const openSlots = (slots.data ?? []).filter((s) => s.status === "AVAILABLE");

  return (
    <DashboardLayout
      items={mentorNav}
      title={`Hi ${user?.profile?.name?.split(" ")[0] ?? "there"} 👋`}
      subtitle="Here's how your mentoring is going"
      actions={
        <Button asChild variant="hero" size="sm">
          <Link to="/mentor/slots">Add slot</Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total sessions" value={all.length} icon={CalendarDays} loading={bookings.isLoading} />
        <StatCard
          label="Upcoming"
          value={upcoming.length}
          icon={CalendarCheck}
          tone="warning"
          loading={bookings.isLoading}
        />
        <StatCard
          label="Completed"
          value={completed.length}
          icon={CheckCircle2}
          tone="success"
          loading={bookings.isLoading}
        />
        <StatCard
          label="Cancelled"
          value={cancelled.length}
          icon={XCircle}
          tone="destructive"
          loading={bookings.isLoading}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="card-surface border-0 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Upcoming sessions</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/mentor/bookings">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {bookings.isLoading ? (
              [0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
            ) : upcoming.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="No upcoming sessions"
                description="Publish more availability so students can book time with you."
                action={
                  <Button asChild variant="hero">
                    <Link to="/mentor/slots">Create a slot</Link>
                  </Button>
                }
              />
            ) : (
              upcoming.slice(0, 5).map((booking) => (
                <div
                  key={booking.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
                >
                  <div>
                    <p className="font-medium">{booking.student?.name || "Student"}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(booking.slot.date)} · {formatTime(booking.slot.start_time)} –{" "}
                      {formatTime(booking.slot.end_time)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground">{booking.meeting_id}</span>
                    <StatusBadge status={booking.status} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="card-surface border-0">
            <CardHeader>
              <CardTitle className="text-base">Your rating</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-4xl font-semibold">{Number(user?.mentor?.rating ?? 0).toFixed(1)}</p>
              <StarRating value={Number(user?.mentor?.rating ?? 0)} className="mt-2" />
              <p className="mt-2 text-sm text-muted-foreground">
                {user?.mentor?.total_reviews ?? 0} review{(user?.mentor?.total_reviews ?? 0) === 1 ? "" : "s"}
              </p>
              <Button asChild variant="ghost" size="sm" className="mt-3 px-0">
                <Link to="/mentor/reviews">
                  <Star /> See reviews
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="card-surface border-0">
            <CardHeader>
              <CardTitle className="text-base">Open availability</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-4xl font-semibold">{openSlots.length}</p>
              <p className="mt-1 text-sm text-muted-foreground">slots waiting to be booked</p>
              {reviews.data && reviews.data.length > 0 ? (
                <p className="mt-4 border-t border-border pt-3 text-sm italic text-muted-foreground">
                  “{reviews.data[0]!.review || "Great session!"}”
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
