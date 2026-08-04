import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { initials } from "@/hooks/use-current-user";
import {
  AVATAR_ACCEPT,
  AVATAR_MAX_BYTES,
  AVATAR_TYPES,
  avatarSrc,
  compressImage,
} from "@/lib/avatar";
import { cleanDbError } from "@/lib/data";

interface AvatarUploaderProps {
  userId: string;
  name?: string | null;
  avatar?: string | null;
}

export function AvatarUploader({ userId, name, avatar }: AvatarUploaderProps) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["current-user"] });
    void queryClient.invalidateQueries({ queryKey: ["mentor-directory"] });
    void queryClient.invalidateQueries({ queryKey: ["mentors-with-slots"] });
  };

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFile(null);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  const pick = (selected: File | null) => {
    if (!selected) return;
    if (!AVATAR_TYPES.includes(selected.type)) {
      toast.error("Only JPG, PNG or WebP images are allowed.");
      return;
    }
    if (selected.size > AVATAR_MAX_BYTES) {
      toast.error("Image is larger than 5 MB.");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const upload = async () => {
    if (!file) return;
    setBusy(true);
    setProgress(15);
    try {
      const blob = await compressImage(file);
      setProgress(45);
      const path = `${userId}/avatar-${Date.now()}.webp`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { contentType: blob.type || "image/webp", upsert: true });
      if (uploadError) throw new Error(uploadError.message);
      setProgress(80);

      const { error } = await supabase.from("profiles").update({ avatar: path }).eq("id", userId);
      if (error) throw new Error(cleanDbError(error.message));

      if (avatar && !/^https?:/.test(avatar)) {
        await supabase.storage.from("avatars").remove([avatar]);
      }
      setProgress(100);
      toast.success("Profile picture updated");
      reset();
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
      setProgress(0);
    } finally {
      setBusy(false);
    }
  };

  const removeAvatar = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.from("profiles").update({ avatar: null }).eq("id", userId);
      if (error) throw new Error(cleanDbError(error.message));
      if (avatar && !/^https?:/.test(avatar)) {
        await supabase.storage.from("avatars").remove([avatar]);
      }
      toast.success("Profile picture removed");
      reset();
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove picture");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <Avatar className="size-20 shrink-0 sm:size-24">
        <AvatarImage src={preview ?? avatarSrc(avatar)} alt={name ? `${name} avatar` : "Avatar"} />
        <AvatarFallback className="text-lg">{initials(name)}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 space-y-3">
        <input
          ref={inputRef}
          type="file"
          accept={AVATAR_ACCEPT}
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0] ?? null)}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            <Upload aria-hidden="true" /> {avatar ? "Replace picture" : "Choose picture"}
          </Button>
          {file && (
            <>
              <Button type="button" variant="hero" size="sm" disabled={busy} onClick={upload}>
                {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : null} Save picture
              </Button>
              <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={reset}>
                Cancel
              </Button>
            </>
          )}
          {avatar && !file && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => void removeAvatar()}
            >
              <Trash2 aria-hidden="true" /> Remove
            </Button>
          )}
        </div>
        {busy && progress > 0 && <Progress value={progress} className="h-2" />}
        <p className="text-xs text-muted-foreground">
          JPG, PNG or WebP · up to 5 MB · large images are resized automatically.
        </p>
      </div>
    </div>
  );
}
