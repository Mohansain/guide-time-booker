import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, CalendarDays, CheckCircle2, Search, Star, XCircle } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { studentNav } from "@/components/dashboard/nav-items";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/empty-state";
import { StarRating } from "@/components/star-rating";
import { StatusBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { initials } from "@/hooks/use-current-user";
import { useRoleGuard } from "@/hooks/use-role-guard";
import { avatarSrc } from "@/lib/avatar";
import {
  expireStaleSessions,
  formatDate,
  formatTime,
  mentorDirectoryQuery,
  studentBookingsQuery,
} from "@/lib/data";

export const Route = createFileRoute("/_authenticated/student/")({
  head: () => ({
    meta: [
      { title: "Student Dashboard — MentorLoop" },
      { name: "description", content: "Track your mentoring sessions and discover new mentors." },
      { property: "og:title", content: "Student Dashboard — MentorLoop" },
      { property: "og:description", content: "Your sessions and recommended mentors in one place." },
    ],
  }),
  component: StudentDashboard,
});

function StudentDashboard() {
  const { data: user } = useRoleGuard("student");
  const bookings = useQuery(studentBookingsQuery(user?.id));
  const mentors = useQuery(mentorDirectoryQuery());

  useEffect(() => {
    void expireStaleSessions();
  }, []);

  const all = bookings.data ?? [];
  const upcoming = all.filter((b) => b.status === "BOOKED");
  const completed = all.filter((b) => b.status === "COMPLETED");
  const cancelled = all.filter((b) => b.status === "CANCELLED");

  return (
    <DashboardLayout
      items={studentNav}
      title={`Hi ${user?.profile?.name?.split(" ")[0] ?? "there"} 👋`}
      subtitle="Your mentoring journey at a glance"
      actions={
        <Button asChild variant="hero" size="sm">
          <Link to="/student/mentors">
            <Search /> Find mentors
          </Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total bookings" value={all.length} icon={CalendarDays} loading={bookings.isLoading} />
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
              <Link to="/student/bookings">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {bookings.isLoading ? (
              [0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
            ) : upcoming.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="No sessions booked"
                description="Browse available slots and book time with a mentor that fits your goals."
                action={
                  <Button asChild variant="hero">
                    <Link to="/student/mentors">Find a mentor</Link>
                  </Button>
                }
              />
            ) : (
              upcoming.slice(0, 5).map((booking) => (
                <div
                  key={booking.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="size-9">
                      <AvatarImage src={avatarSrc(booking.mentor?.profile?.avatar)} alt="" />
                      <AvatarFallback>{initials(booking.mentor?.profile?.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{booking.mentor?.profile?.name || "Mentor"}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(booking.slot.date)} · {formatTime(booking.slot.start_time)}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="card-surface border-0">
          <CardHeader>
            <CardTitle className="text-base">Top rated mentors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mentors.isLoading ? (
              [0, 1, 2].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)
            ) : (mentors.data ?? []).length === 0 ? (
              <EmptyState icon={Star} title="No mentors yet" description="Mentors will appear here once they join." />
            ) : (
              (mentors.data ?? []).slice(0, 5).map((mentor) => (
                <div key={mentor.id} className="flex items-center gap-3">
                  <Avatar className="size-9">
                    <AvatarImage src={avatarSrc(mentor.profile?.avatar)} alt="" />
                    <AvatarFallback>{initials(mentor.profile?.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{mentor.profile?.name || "Mentor"}</p>
                    <p className="truncate text-xs text-muted-foreground">{mentor.specialization || "Mentor"}</p>
                  </div>
                  <StarRating value={Number(mentor.rating ?? 0)} size="sm" />
                </div>
              ))
            )}
            <Button asChild variant="heroOutline" className="w-full">
              <Link to="/student/mentors">Browse all slots</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
