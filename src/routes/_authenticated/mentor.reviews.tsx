import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { mentorNav } from "@/components/dashboard/nav-items";
import { EmptyState } from "@/components/empty-state";
import { StarRating } from "@/components/star-rating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { initials } from "@/hooks/use-current-user";
import { useRoleGuard } from "@/hooks/use-role-guard";
import { mentorReviewsQuery } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/mentor/reviews")({
  head: () => ({
    meta: [
      { title: "Mentor Reviews — MentorLoop" },
      { name: "description", content: "See what students say about your mentoring sessions." },
      { property: "og:title", content: "Mentor Reviews — MentorLoop" },
      { property: "og:description", content: "Feedback from the students you mentored." },
    ],
  }),
  component: MentorReviews,
});

function MentorReviews() {
  const { data: user } = useRoleGuard("mentor");
  const reviews = useQuery(mentorReviewsQuery(user?.mentor?.id));
  const list = reviews.data ?? [];

  return (
    <DashboardLayout items={mentorNav} title="Reviews" subtitle="Feedback from your students">
      <Card className="card-surface mb-6 border-0">
        <CardContent className="flex flex-wrap items-center gap-6 p-6">
          <div>
            <p className="font-display text-5xl font-semibold">{Number(user?.mentor?.rating ?? 0).toFixed(1)}</p>
            <StarRating value={Number(user?.mentor?.rating ?? 0)} className="mt-2" />
          </div>
          <div className="text-sm text-muted-foreground">
            Based on {user?.mentor?.total_reviews ?? 0} review{(user?.mentor?.total_reviews ?? 0) === 1 ? "" : "s"}
            <br />
            Ratings update automatically after each review.
          </div>
        </CardContent>
      </Card>

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
          description="Once you complete sessions, students can leave a rating and a note."
        />
      ) : (
        <div className="space-y-3">
          {list.map((review) => (
            <Card key={review.id} className="card-surface animate-fade-up border-0">
              <CardContent className="flex gap-4 p-5">
                <Avatar className="size-10">
                  <AvatarImage src={review.student?.avatar ?? undefined} alt="" />
                  <AvatarFallback>{initials(review.student?.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-medium">{review.student?.name || "Student"}</p>
                    <StarRating value={review.rating} size="sm" />
                  </div>
                  {review.review ? <p className="mt-1.5 text-sm text-muted-foreground">{review.review}</p> : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
