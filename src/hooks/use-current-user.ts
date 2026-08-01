import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Mentor, Profile } from "@/lib/data";

export type AppRole = "mentor" | "student" | "admin";

export interface CurrentUser {
  id: string;
  email: string;
  profile: Profile | null;
  role: AppRole | null;
  mentor: Mentor | null;
}

export const currentUserQuery = () =>
  queryOptions<CurrentUser | null>({
    queryKey: ["current-user"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) return null;

      const [profileRes, rolesRes, mentorRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase.from("mentors").select("*").eq("profile_id", user.id).maybeSingle(),
      ]);

      const roles = (rolesRes.data ?? []).map((r) => r.role as AppRole);
      const role: AppRole | null = roles.includes("mentor")
        ? "mentor"
        : roles.includes("student")
          ? "student"
          : (roles[0] ?? null);

      return {
        id: user.id,
        email: user.email ?? "",
        profile: profileRes.data ?? null,
        role,
        mentor: mentorRes.data ?? null,
      };
    },
  });

export function useCurrentUser() {
  return useQuery(currentUserQuery());
}

export function initials(name?: string | null) {
  if (!name) return "U";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
