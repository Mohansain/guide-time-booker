import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Loader2, Search } from "lucide-react";
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
import { availableSlotsQuery, bookSlot, formatDate, formatTime } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/student/mentors")({
  head: () => ({
    meta: [
      { title: "Find Mentors — MentorLoop" },
      { name: "description", content: "Browse available mentor slots and book a session instantly." },
      { property: "og:title", content: "Find Mentors — MentorLoop" },
      { property: "og:description", content: "Search mentors by name, skill or date and book a slot." },
    ],
  }),
  component: FindMentors,
});

function FindMentors() {
  useRoleGuard("student");
  const queryClient = useQueryClient();
  const slots = useQuery(availableSlotsQuery());
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const book = useMutation({
    mutationFn: bookSlot,
    onSuccess: () => {
      toast.success("Session booked! Check My Bookings for details.");
      void queryClient.invalidateQueries({ queryKey: ["available-slots"] });
      void queryClient.invalidateQueries({ queryKey: ["student-bookings"] });
    },
    onError: (error: Error) => toast.error(error.message),
    onSettled: () => setPendingId(null),
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (slots.data ?? []).filter((slot) => {
      const matchesDate = !date || slot.date === date;
      const haystack = `${slot.mentor?.profile?.name ?? ""} ${slot.mentor?.specialization ?? ""}`.toLowerCase();
      return matchesDate && (!term || haystack.includes(term));
    });
  }, [date, search, slots.data]);

  return (
    <DashboardLayout items={studentNav} title="Find mentors" subtitle="Book any available slot instantly">
      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by mentor or skill"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Input type="date" className="w-auto" value={date} onChange={(e) => setDate(e.target.value)} />
        {date ? (
          <Button variant="ghost" onClick={() => setDate("")}>
            Clear date
          </Button>
        ) : null}
      </div>

      {slots.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No slots match your filters"
          description="Try a different date or clear the search to see everything that's available."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((slot) => (
            <Card key={slot.id} className="card-surface animate-fade-up border-0">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <Avatar className="size-11">
                    <AvatarImage src={slot.mentor?.profile?.avatar ?? undefined} alt="" />
                    <AvatarFallback>{initials(slot.mentor?.profile?.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{slot.mentor?.profile?.name || "Mentor"}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {slot.mentor?.specialization || "Mentor"}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <StarRating value={Number(slot.mentor?.rating ?? 0)} size="sm" />
                  <span className="text-xs text-muted-foreground">
                    {Number(slot.mentor?.rating ?? 0).toFixed(1)} · {slot.mentor?.total_reviews ?? 0} reviews
                  </span>
                </div>
                <div className="mt-4 rounded-xl bg-muted/60 p-3 text-sm">
                  <p className="font-medium">{formatDate(slot.date)}</p>
                  <p className="text-muted-foreground">
                    {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                  </p>
                </div>
                <Button
                  variant="hero"
                  className="mt-4 w-full"
                  disabled={book.isPending}
                  onClick={() => {
                    setPendingId(slot.id);
                    book.mutate(slot.id);
                  }}
                >
                  {book.isPending && pendingId === slot.id ? <Loader2 className="animate-spin" /> : null}
                  Book session
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
