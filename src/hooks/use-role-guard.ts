import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useCurrentUser, type AppRole } from "@/hooks/use-current-user";

/** Keeps a dashboard page limited to one role and bounces everyone else home. */
export function useRoleGuard(expected: AppRole) {
  const navigate = useNavigate();
  const query = useCurrentUser();
  const role = query.data?.role;

  useEffect(() => {
    if (query.isLoading || !query.data) return;
    if (role && role !== expected) {
      navigate({ to: role === "mentor" ? "/mentor" : "/student", replace: true });
    }
  }, [expected, navigate, query.data, query.isLoading, role]);

  return query;
}
