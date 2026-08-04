import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AvatarUploader } from "@/components/avatar-uploader";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

import { studentNav } from "@/components/dashboard/nav-items";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRoleGuard } from "@/hooks/use-role-guard";
import { cleanDbError } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/student/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — MentorLoop" },
      { name: "description", content: "Update the name mentors see when you book a session." },
      { property: "og:title", content: "My Profile — MentorLoop" },
      { property: "og:description", content: "Manage your student profile details." },
    ],
  }),
  component: StudentProfile,
});

function StudentProfile() {
  const { data: user } = useRoleGuard("student");
  const queryClient = useQueryClient();
  const [name, setName] = useState("");

  useEffect(() => {
    if (user) setName(user.profile?.name ?? "");
  }, [user]);

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in.");
      const { error } = await supabase.from("profiles").update({ name }).eq("id", user.id);
      if (error) throw new Error(cleanDbError(error.message));
    },
    onSuccess: () => {
      toast.success("Profile updated");
      void queryClient.invalidateQueries({ queryKey: ["current-user"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <DashboardLayout items={studentNav} title="Profile" subtitle="How mentors see you">
      <Card className="card-surface max-w-xl border-0">
        <CardHeader>
          <CardTitle className="text-base">Student profile</CardTitle>
          <CardDescription>Your name is shown to mentors on their bookings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {user && (
            <AvatarUploader
              userId={user.id}
              name={user.profile?.name}
              avatar={user.profile?.avatar}
            />
          )}
          <div className="space-y-2">

            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email ?? ""} disabled />
          </div>
          <Button variant="hero" onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? <Loader2 className="animate-spin" /> : <Save />} Save changes
          </Button>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
