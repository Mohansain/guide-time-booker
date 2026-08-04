import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GraduationCap, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { next?: string } =>
    typeof s['next'] === "string" && s['next'].startsWith("/") ? { next: s['next'] } : {},
  head: () => ({
    meta: [
      { title: "Sign in — MentorLoop" },
      {
        name: "description",
        content: "Sign in or create your MentorLoop account as a mentor or a student.",
      },
      { property: "og:title", content: "Sign in — MentorLoop" },
      {
        property: "og:description",
        content: "Create a mentor or student account and start booking sessions.",
      },
    ],
  }),
  component: AuthPage,
});

const signInSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
});

const signUpSchema = signInSchema.extend({
  name: z.string().min(2, "Tell us your name"),
  specialization: z.string().optional(),
  bio: z.string().max(500).optional(),
});

type SignInValues = z.infer<typeof signInSchema>;
type SignUpValues = z.infer<typeof signUpSchema>;

function AuthPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  // Same-origin relative path only (validated in validateSearch).
  const afterAuth = next ?? "/dashboard";

  function goAfterAuth() {
    if (next) {
      window.location.href = next;
      return;
    }
    navigate({ to: "/dashboard", replace: true });
  }
  const [role, setRole] = useState<"student" | "mentor">("student");
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) goAfterAuth();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, next]);

  const signInForm = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const signUpForm = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "", specialization: "", bio: "" },
  });

  async function onSignIn(values: SignInValues) {
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
    goAfterAuth();
  }

  async function onSignUp(values: SignUpValues) {
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}${afterAuth}`,
        data: {
          name: values.name,
          role,
          specialization: values.specialization ?? "",
          bio: values.bio ?? "",
        },
      },
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created — you're all set!");
    goAfterAuth();
  }

  async function onGoogle() {
    setGoogleLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}${afterAuth}`,
    });
    if (result.error) {
      setGoogleLoading(false);
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    goAfterAuth();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-hero px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2.5">
          <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-brand text-primary-foreground shadow-[var(--shadow-glow)]">
            <GraduationCap className="size-5" />
          </span>
          <span className="font-display text-xl font-semibold">MentorLoop</span>
        </Link>

        <Card className="card-surface animate-fade-up border-0">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-2xl">Welcome</CardTitle>
            <CardDescription>Book mentoring sessions or share your expertise.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-5">
                <form className="space-y-4" onSubmit={signInForm.handleSubmit(onSignIn)}>
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input id="signin-email" type="email" autoComplete="email" {...signInForm.register("email")} />
                    <FieldError message={signInForm.formState.errors.email?.message} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      autoComplete="current-password"
                      {...signInForm.register("password")}
                    />
                    <FieldError message={signInForm.formState.errors.password?.message} />
                  </div>
                  <Button type="submit" variant="hero" className="w-full" disabled={signInForm.formState.isSubmitting}>
                    {signInForm.formState.isSubmitting ? <Loader2 className="animate-spin" /> : null}
                    Sign in
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-5">
                <div className="mb-4 grid grid-cols-2 gap-2">
                  {(["student", "mentor"] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setRole(option)}
                      className={cn(
                        "flex cursor-pointer flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all",
                        role === option
                          ? "border-primary bg-primary/8 shadow-[var(--shadow-soft)]"
                          : "border-border hover:bg-accent",
                      )}
                    >
                      {option === "student" ? (
                        <Users className="size-4 text-primary" />
                      ) : (
                        <GraduationCap className="size-4 text-primary" />
                      )}
                      <span className="text-sm font-semibold capitalize">{option}</span>
                      <span className="text-xs text-muted-foreground">
                        {option === "student" ? "Book sessions" : "Offer time slots"}
                      </span>
                    </button>
                  ))}
                </div>

                <form className="space-y-4" onSubmit={signUpForm.handleSubmit(onSignUp)}>
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full name</Label>
                    <Input id="signup-name" {...signUpForm.register("name")} />
                    <FieldError message={signUpForm.formState.errors.name?.message} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" type="email" autoComplete="email" {...signUpForm.register("email")} />
                    <FieldError message={signUpForm.formState.errors.email?.message} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      autoComplete="new-password"
                      {...signUpForm.register("password")}
                    />
                    <FieldError message={signUpForm.formState.errors.password?.message} />
                  </div>

                  {role === "mentor" ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="signup-specialization">Specialization</Label>
                        <Input
                          id="signup-specialization"
                          placeholder="e.g. Frontend engineering"
                          {...signUpForm.register("specialization")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-bio">Short bio</Label>
                        <Textarea
                          id="signup-bio"
                          rows={3}
                          placeholder="What can students learn from you?"
                          {...signUpForm.register("bio")}
                        />
                      </div>
                    </>
                  ) : null}

                  <Button type="submit" variant="hero" className="w-full" disabled={signUpForm.formState.isSubmitting}>
                    {signUpForm.formState.isSubmitting ? <Loader2 className="animate-spin" /> : null}
                    Create {role} account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>

            <Button variant="heroOutline" className="w-full" onClick={onGoogle} disabled={googleLoading}>
              {googleLoading ? <Loader2 className="animate-spin" /> : <GoogleIcon />}
              Continue with Google
            </Button>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Google sign-ups join as students. Need a mentor account? Use the form above.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FieldError({ message }: { message?: string | undefined }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="currentColor"
        d="M21.35 11.1H12v2.98h5.35c-.23 1.4-1.7 4.1-5.35 4.1a5.9 5.9 0 0 1 0-11.8c1.68 0 2.8.72 3.44 1.33l2.35-2.27C16.3 3.9 14.4 3 12 3a9 9 0 1 0 0 18c5.2 0 8.63-3.65 8.63-8.79 0-.59-.06-1.04-.28-1.11Z"
      />
    </svg>
  );
}
