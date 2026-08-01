import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { mentorNav } from "@/components/dashboard/nav-items";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoleGuard } from "@/hooks/use-role-guard";
import { cleanDbError, formatDate, formatTime, mentorSlotsQuery, type Slot } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/mentor/slots")({
  head: () => ({
    meta: [
      { title: "Manage Slots — MentorLoop" },
      { name: "description", content: "Create and manage the time slots students can book." },
      { property: "og:title", content: "Manage Slots — MentorLoop" },
      { property: "og:description", content: "Publish availability students can book instantly." },
    ],
  }),
  component: MentorSlots,
});

const today = () => new Date().toISOString().slice(0, 10);

function MentorSlots() {
  const { data: user } = useRoleGuard("mentor");
  const mentorId = user?.mentor?.id;
  const queryClient = useQueryClient();
  const slots = useQuery(mentorSlotsQuery(mentorId));

  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(today());
  const [start, setStart] = useState("10:00");
  const [end, setEnd] = useState("11:00");

  const createSlot = useMutation({
    mutationFn: async () => {
      if (!mentorId) throw new Error("Mentor profile missing.");
      if (end <= start) throw new Error("End time must be after the start time.");
      const { error } = await supabase.from("slots").insert({
        mentor_id: mentorId,
        date,
        start_time: start,
        end_time: end,
      });
      if (error) throw new Error(cleanDbError(error.message));
    },
    onSuccess: () => {
      toast.success("Slot published");
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["mentor-slots"] });
      void queryClient.invalidateQueries({ queryKey: ["available-slots"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteSlot = useMutation({
    mutationFn: async (slotId: string) => {
      const { error } = await supabase.from("slots").delete().eq("id", slotId);
      if (error) throw new Error(cleanDbError(error.message));
    },
    onSuccess: () => {
      toast.success("Slot removed");
      void queryClient.invalidateQueries({ queryKey: ["mentor-slots"] });
      void queryClient.invalidateQueries({ queryKey: ["available-slots"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const grouped = useMemo(() => {
    const all = slots.data ?? [];
    return {
      available: all.filter((s) => s.status === "AVAILABLE"),
      booked: all.filter((s) => s.status === "BOOKED"),
      past: all.filter((s) => s.status === "EXPIRED" || s.status === "COMPLETED" || s.status === "CANCELLED"),
    };
  }, [slots.data]);

  const dialog = (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="hero" size="sm">
          <Plus /> New slot
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Publish a new slot</DialogTitle>
          <DialogDescription>Students can book any available slot instantly.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="slot-date">Date</Label>
            <Input id="slot-date" type="date" min={today()} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="slot-start">Start</Label>
              <Input id="slot-start" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slot-end">End</Label>
              <Input id="slot-end" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="hero" onClick={() => createSlot.mutate()} disabled={createSlot.isPending}>
            {createSlot.isPending ? <Loader2 className="animate-spin" /> : null}
            Publish slot
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <DashboardLayout
      items={mentorNav}
      title="Slots"
      subtitle="Manage the availability students can book"
      actions={dialog}
    >
      <Tabs defaultValue="available">
        <TabsList>
          <TabsTrigger value="available">Available ({grouped.available.length})</TabsTrigger>
          <TabsTrigger value="booked">Booked ({grouped.booked.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({grouped.past.length})</TabsTrigger>
        </TabsList>

        {(["available", "booked", "past"] as const).map((key) => (
          <TabsContent key={key} value={key} className="mt-5">
            {slots.isLoading ? (
              <div className="grid gap-3 md:grid-cols-2">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                ))}
              </div>
            ) : grouped[key].length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title={`No ${key} slots`}
                description="Publish a slot and it will show up here for students to book."
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {grouped[key].map((slot) => (
                  <SlotCard
                    key={slot.id}
                    slot={slot}
                    onDelete={slot.status === "AVAILABLE" ? () => deleteSlot.mutate(slot.id) : undefined}
                    deleting={deleteSlot.isPending}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </DashboardLayout>
  );
}

function SlotCard({
  slot,
  onDelete,
  deleting,
}: {
  slot: Slot;
  onDelete?: (() => void) | undefined;
  deleting?: boolean;
}) {
  return (
    <Card className="card-surface animate-fade-up border-0">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium">{formatDate(slot.date)}</p>
            <p className="text-sm text-muted-foreground">
              {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
            </p>
          </div>
          <StatusBadge status={slot.status} />
        </div>
        {onDelete ? (
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 px-0 text-destructive hover:text-destructive"
            onClick={onDelete}
            disabled={deleting}
          >
            <Trash2 /> Remove
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
