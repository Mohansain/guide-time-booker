import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AvatarUploader } from "@/components/avatar-uploader";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

import { mentorNav } from "@/components/dashboard/nav-items";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRoleGuard } from "@/hooks/use-role-guard";
import { cleanDbError } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/mentor/settings")({
  head: () => ({
    meta: [
      { title: "Mentor Settings — MentorLoop" },
      { name: "description", content: "Update your mentor profile, specialization and bio." },
      { property: "og:title", content: "Mentor Settings — MentorLoop" },
      { property: "og:description", content: "Keep your mentor profile up to date." },
    ],
  }),
  component: MentorSettings,
});

function MentorSettings() {
  const { data: user } = useRoleGuard("mentor");
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [experience, setExperience] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (!user) return;
    setName(user.profile?.name ?? "");
    setSpecialization(user.mentor?.specialization ?? "");
    setExperience(user.mentor?.experience?.toString() ?? "");
    setBio(user.mentor?.bio ?? "");
  }, [user]);

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in.");
      const profileRes = await supabase.from("profiles").update({ name }).eq("id", user.id);
      if (profileRes.error) throw new Error(cleanDbError(profileRes.error.message));

      if (user.mentor) {
        const mentorRes = await supabase
          .from("mentors")
          .update({
            specialization,
            bio,
            experience: experience === "" ? 0 : Number(experience),
          })
          .eq("id", user.mentor.id);
        if (mentorRes.error) throw new Error(cleanDbError(mentorRes.error.message));
      }
    },
    onSuccess: () => {
      toast.success("Profile updated");
      void queryClient.invalidateQueries({ queryKey: ["current-user"] });
      void queryClient.invalidateQueries({ queryKey: ["mentor-directory"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <DashboardLayout items={mentorNav} title="Settings" subtitle="How students see you">
      <Card className="card-surface max-w-2xl border-0">
        <CardHeader>
          <CardTitle className="text-base">Mentor profile</CardTitle>
          <CardDescription>This information appears in the mentor directory.</CardDescription>
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="specialization">Specialization</Label>
              <Input
                id="specialization"
                placeholder="e.g. Product design"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience">Years of experience</Label>
              <Input
                id="experience"
                type="number"
                min={0}
                max={60}
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
          <Button variant="hero" onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? <Loader2 className="animate-spin" /> : <Save />} Save changes
          </Button>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
