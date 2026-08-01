import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { studentNav } from "@/components/dashboard/nav-items";
import { EmptyState } from "@/components/empty-state";
import { StarRating } from "@/components/star-rating";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoleGuard } from "@/hooks/use-role-guard";
import { studentReviewsQuery } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/student/reviews")({
  head: () => ({
    meta: [
      { title: "My Reviews — MentorLoop" },
      { name: "description", content: "Reviews you left for your mentors after completed sessions." },
      { property: "og:title", content: "My Reviews — MentorLoop" },
      { property: "og:description", content: "The feedback you shared with your mentors." },
    ],
  }),
  component: StudentReviews,
});

function StudentReviews() {
  const { data: user } = useRoleGuard("student");
  const reviews = useQuery(studentReviewsQuery(user?.id));
  const list = reviews.data ?? [];

  return (
    <DashboardLayout items={studentNav} title="My reviews" subtitle="Feedback you shared with mentors">
      {reviews.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No reviews yet"
          description="After a session is completed you can rate your mentor from My Bookings."
        />
      ) : (
        <div className="space-y-3">
          {list.map((review) => (
            <Card key={review.id} className="card-surface animate-fade-up border-0">
              <CardContent className="p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-medium">{review.mentor?.profile?.name || "Mentor"}</p>
                  <StarRating value={review.rating} size="sm" />
                </div>
                {review.review ? <p className="mt-1.5 text-sm text-muted-foreground">{review.review}</p> : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
