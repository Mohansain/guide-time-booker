import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Loader2, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { studentNav } from "@/components/dashboard/nav-items";
import { EmptyState } from "@/components/empty-state";
import { StarRating } from "@/components/star-rating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { initials } from "@/hooks/use-current-user";
import { useRoleGuard } from "@/hooks/use-role-guard";
import { bookSlot, formatDate, formatTime, mentorsWithSlotsQuery } from "@/lib/data";
import { avatarSrc } from "@/lib/avatar";

export const Route = createFileRoute("/_authenticated/student/mentors")({
  head: () => ({
    meta: [
      { title: "Find Mentors — MentorLoop" },
      {
        name: "description",
        content: "Search mentors by name, skill or bio and book an available slot instantly.",
      },
      { property: "og:title", content: "Find Mentors — MentorLoop" },
      {
        property: "og:description",
        content: "Search mentors by name, skill or date and book a slot.",
      },
    ],
  }),
  component: FindMentors,
});

function FindMentors() {
  useRoleGuard("student");
  const queryClient = useQueryClient();
  const mentors = useQuery(mentorsWithSlotsQuery());
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const book = useMutation({
    mutationFn: bookSlot,
    onSuccess: () => {
      toast.success("Session booked! Check My Bookings for details.");
      void queryClient.invalidateQueries({ queryKey: ["mentors-with-slots"] });
      void queryClient.invalidateQueries({ queryKey: ["available-slots"] });
      void queryClient.invalidateQueries({ queryKey: ["student-bookings"] });
    },
    onError: (error: Error) => toast.error(error.message),
    onSettled: () => setPendingId(null),
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (mentors.data ?? [])
      .map((mentor) => ({
        ...mentor,
        slots: date ? mentor.slots.filter((slot) => slot.date === date) : mentor.slots,
      }))
      .filter((mentor) => {
        if (date && mentor.slots.length === 0) return false;
        if (!term) return true;
        const haystack = [
          mentor.profile?.name,
          mentor.profile?.email,
          mentor.specialization,
          mentor.bio,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(term);
      });
  }, [date, search, mentors.data]);

  const hasMentors = (mentors.data ?? []).length > 0;

  return (
    <DashboardLayout
      items={studentNav}
      title="Find mentors"
      subtitle="Search by mentor, skill or bio — then book any open slot"
    >
      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            className="pl-9"
            aria-label="Search mentors"
            placeholder="Search by mentor, skill or keyword"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Input
          type="date"
          aria-label="Filter by date"
          className="w-auto"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        {search || date ? (
          <Button
            variant="ghost"
            onClick={() => {
              setSearch("");
              setDate("");
            }}
          >
            Clear filters
          </Button>
        ) : null}
      </div>

      {mentors.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-52 w-full rounded-2xl" />
          ))}
        </div>
      ) : !hasMentors ? (
        <EmptyState
          icon={Users}
          title="No mentors have joined yet"
          description="Once mentors create their profiles they'll show up here and you can book their open slots."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title={`No mentors match ${search ? `"${search.trim()}"` : "your filters"}`}
          description="Try a different name or skill, or clear the filters to see every mentor."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((mentor) => (
            <Card key={mentor.id} className="card-surface animate-fade-up border-0">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <Avatar className="size-11">
                    <AvatarImage src={avatarSrc(mentor.profile?.avatar)} alt="" loading="lazy" />
                    <AvatarFallback>{initials(mentor.profile?.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{mentor.profile?.name || "Mentor"}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {mentor.specialization || "Mentor"}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <StarRating value={Number(mentor.rating ?? 0)} size="sm" />
                  <span className="text-xs text-muted-foreground">
                    {Number(mentor.rating ?? 0).toFixed(1)} · {mentor.total_reviews ?? 0} reviews
                  </span>
                </div>
                {mentor.bio ? (
                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{mentor.bio}</p>
                ) : null}

                {mentor.slots.length === 0 ? (
                  <p className="mt-4 flex items-center gap-2 rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">
                    <CalendarDays className="size-4" aria-hidden="true" />
                    No open slots right now
                  </p>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {mentor.slots.slice(0, 3).map((slot) => (
                      <li
                        key={slot.id}
                        className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 p-3 text-sm"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{formatDate(slot.date)}</span>
                          <span className="block text-xs text-muted-foreground">
                            {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                          </span>
                        </span>
                        <Button
                          size="sm"
                          variant="hero"
                          disabled={book.isPending}
                          onClick={() => {
                            setPendingId(slot.id);
                            book.mutate(slot.id);
                          }}
                        >
                          {book.isPending && pendingId === slot.id ? (
                            <Loader2 className="animate-spin" aria-hidden="true" />
                          ) : null}
                          Book
                        </Button>
                      </li>
                    ))}
                    {mentor.slots.length > 3 ? (
                      <li className="text-xs text-muted-foreground">
                        +{mentor.slots.length - 3} more open slots
                      </li>
                    ) : null}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
