/**
 * Profile pictures live in a private "avatars" storage bucket.
 * `profiles.avatar` stores the object path (`<user-id>/<file>`); the
 * read-only proxy route below turns it into a usable <img> src.
 */
export function avatarSrc(value?: string | null): string | undefined {
  if (!value) return undefined;
  if (/^(https?:|data:|blob:|\/)/.test(value)) return value;
  return `/api/public/avatars/${value}`;
}

export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const AVATAR_ACCEPT = "image/jpeg,image/jpg,image/png,image/webp";
export const AVATAR_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

/** Downscale to max 512px and re-encode as WebP to keep uploads small. */
export async function compressImage(file: File, max = 512): Promise<Blob> {
  if (typeof window === "undefined") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.85),
    );
    return blob && blob.size > 0 ? blob : file;
  } catch {
    return file;
  }
}
