import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { expireStaleSessions } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardRedirect,
});

function DashboardRedirect() {
  const navigate = useNavigate();
  const { data, isLoading } = useCurrentUser();

  useEffect(() => {
    void expireStaleSessions();
  }, []);

  useEffect(() => {
    if (isLoading || !data) return;
    navigate({ to: data.role === "mentor" ? "/mentor" : "/student", replace: true });
  }, [data, isLoading, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="size-6 animate-spin text-primary" />
    </div>
  );
}
