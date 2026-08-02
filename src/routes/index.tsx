import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  Clock,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StarRating } from "@/components/star-rating";
import { ThemeToggle } from "@/components/theme-toggle";
import { useCurrentUser, initials } from "@/hooks/use-current-user";
import { publicTopMentorsQuery } from "@/lib/data";
import { Reveal } from "@/components/reveal";
import heroImage from "@/assets/hero-mentoring.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MentorLoop — Book 1:1 Mentoring Sessions Instantly" },
      {
        name: "description",
        content:
          "Browse verified mentors, see live availability, and lock in a 1:1 mentoring session in seconds. Slot management, ratings and reminders included.",
      },
      { property: "og:title", content: "MentorLoop — Book 1:1 Mentoring Sessions Instantly" },
      {
        property: "og:description",
        content:
          "Find a mentor, pick an open slot, and meet 1:1. Race-safe booking, live availability and honest ratings.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "index, follow" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              name: "MentorLoop",
              description:
                "Book 1:1 mentoring sessions with verified mentors using live availability and race-safe booking.",
            },
            {
              "@type": "Organization",
              name: "MentorLoop",
              description: "A mentor booking platform connecting students with expert mentors.",
            },
            {
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "How do I book a mentoring session?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Create a student account, browse mentors by specialization or rating, pick an open slot and confirm — the session is booked instantly with its own meeting link.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Can two students book the same slot?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "No. Every booking runs inside a row-locked database transaction, so a slot can only ever be claimed once.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How are mentor ratings calculated?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Only students who completed a session can leave a review, and mentor averages update automatically from those reviews.",
                  },
                },
              ],
            },
          ],
        }),
      },
    ],
  }),
  component: Landing,
});


const features = [
  {
    icon: CalendarDays,
    title: "Live availability",
    body: "Mentors publish slots once. Students always see what is genuinely open right now.",
  },
  {
    icon: ShieldCheck,
    title: "No double bookings",
    body: "Every booking runs through a row-locked transaction, so two students can never grab the same slot.",
  },
  {
    icon: Video,
    title: "Instant meeting links",
    body: "Each confirmed session gets its own meeting ID the moment the booking succeeds.",
  },
  {
    icon: Star,
    title: "Honest ratings",
    body: "Students review completed sessions and mentor averages update automatically.",
  },
  {
    icon: Clock,
    title: "Automatic statuses",
    body: "Available, Booked, Completed, Cancelled and Expired are handled for you — no stale calendars.",
  },
  {
    icon: Users,
    title: "Two focused dashboards",
    body: "Mentors manage slots and requests. Students track upcoming and past sessions.",
  },
];

const steps = [
  {
    icon: GraduationCap,
    title: "Create your account",
    body: "Sign up as a mentor or a student in one step — your dashboard is picked for you.",
  },
  {
    icon: CalendarCheck,
    title: "Publish or pick a slot",
    body: "Mentors open time blocks. Students filter by specialization and rating, then book.",
  },
  {
    icon: Sparkles,
    title: "Meet and review",
    body: "Join the 1:1 session, mark it complete and leave a rating that helps the next student.",
  },
];

function Landing() {
  const { data: user } = useCurrentUser();
  const { data: mentors } = useQuery(publicTopMentorsQuery());
  const dashboardTo = user?.role === "mentor" ? "/mentor" : "/student";

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2" aria-label="MentorLoop home">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-brand text-primary-foreground shadow-[var(--shadow-glow)]">
              <CalendarCheck className="size-5" aria-hidden="true" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">MentorLoop</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#how-it-works" className="transition-colors hover:text-foreground">
              How it works
            </a>
            <a href="#mentors" className="transition-colors hover:text-foreground">
              Mentors
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <Button asChild size="sm">
                <Link to={dashboardTo}>Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <Link to="/auth">Sign in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/auth">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-hero">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-20 lg:grid-cols-2 lg:py-28">
            <div className="animate-fade-up">
              <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
                <Sparkles className="size-3.5 text-primary" />
                Race-safe booking, live availability
              </span>
              <h1 className="font-display mt-5 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                Book the mentor you need,{" "}
                <span className="text-gradient-brand">in seconds</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                MentorLoop turns scattered calendars into one clean booking flow. Mentors publish
                real availability, students claim a slot, and every session status stays accurate
                on its own.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild variant="hero" size="lg">
                  <Link to={user ? dashboardTo : "/auth"}>
                    {user ? "Go to dashboard" : "Start free"}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="heroOutline" size="lg">
                  <a href="#how-it-works">See how it works</a>
                </Button>
              </div>
              <dl className="mt-10 grid max-w-md grid-cols-3 gap-4">
                {[
                  { k: "Live", v: "availability" },
                  { k: "0", v: "double bookings" },
                  { k: "1:1", v: "focused sessions" },
                ].map((s) => (
                  <div key={s.v}>
                    <dt className="font-display text-2xl font-bold">{s.k}</dt>
                    <dd className="text-xs text-muted-foreground">{s.v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="relative">
              <div className="card-surface overflow-hidden rounded-3xl p-2 shadow-[var(--shadow-lift)]">
                <img
                  src={heroImage}
                  alt="MentorLoop scheduling dashboard showing available mentoring slots"
                  className="h-full w-full rounded-2xl object-cover"
                  width={1024}
                  height={768}
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto w-full max-w-6xl px-4 py-20">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Everything a booking system should already do
            </h2>
            <p className="mt-3 text-muted-foreground">
              Built for two sides of the same conversation — with the boring reliability parts
              handled in the database, not in hope.
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 80}>
                <Card className="card-surface h-full border-border/60 transition-transform duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                      <f.icon className="size-5" aria-hidden="true" />
                    </span>
                    <h3 className="font-display mt-4 text-base font-semibold">{f.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="border-y border-border/60 bg-muted/30 py-20">
          <div className="mx-auto w-full max-w-6xl px-4">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Three steps, no back-and-forth
            </h2>
            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {steps.map((s, i) => (
                <Reveal as="li" key={s.title} delay={i * 120} className="card-surface rounded-2xl p-6">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-full bg-gradient-brand text-sm font-semibold text-primary-foreground">
                      {i + 1}
                    </span>
                    <s.icon className="size-5 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="font-display mt-4 text-base font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* Mentors */}
        <section id="mentors" className="mx-auto w-full max-w-6xl px-4 py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Top-rated mentors
              </h2>
              <p className="mt-3 text-muted-foreground">
                Ratings come only from students who actually completed a session.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/auth">Browse all mentors</Link>
            </Button>
          </div>

          {mentors && mentors.length > 0 ? (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {mentors.map((m, i) => (
                <Reveal key={m.id} delay={i * 80}>
                <Card className="card-surface border-border/60">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <span className="grid size-11 place-items-center rounded-full bg-primary/10 font-semibold text-primary">
                        {initials(m.profile?.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{m.profile?.name ?? "Mentor"}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {m.specialization ?? "Mentor"}
                        </p>
                      </div>
                    </div>
                    {m.bio ? (
                      <p className="mt-4 line-clamp-3 text-sm text-muted-foreground">{m.bio}</p>
                    ) : null}
                    <div
                      className="mt-4 flex items-center"
                      aria-label={`Rated ${Number(m.rating ?? 0).toFixed(1)} out of 5`}
                    >
                      <StarRating value={Number(m.rating ?? 0)} />
                      <span className="ml-2 text-xs text-muted-foreground">{Number(m.rating ?? 0).toFixed(1)}</span>
                    </div>
                  </CardContent>
                </Card>
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="card-surface mt-10 rounded-2xl p-10 text-center">
              <p className="text-sm text-muted-foreground">
                Mentor profiles appear here as soon as the first mentors join.
              </p>
              <Button asChild className="mt-5">
                <Link to="/auth">Become a mentor</Link>
              </Button>
            </div>
          )}
        </section>

        {/* CTA */}
        <section className="px-4 pb-24">
          <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-3xl bg-gradient-brand px-6 py-14 text-center shadow-[var(--shadow-glow)]">
            <h2 className="font-display text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
              Your next session is one click away
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-foreground/85">
              Join as a student to book mentors, or as a mentor to open your calendar and start
              taking sessions today.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link to="/auth">Create your account</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <CalendarCheck className="size-4 text-primary" />
            <span className="font-medium text-foreground">MentorLoop</span>
          </div>
          <p>© {new Date().getFullYear()} MentorLoop. Book better mentoring.</p>
        </div>
      </footer>
    </div>
  );
}
