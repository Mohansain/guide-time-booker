import { createFileRoute } from "@tanstack/react-router";

const PATH_RE = /^[0-9a-fA-F-]{36}\/[A-Za-z0-9._-]+$/;

export const Route = createFileRoute("/api/public/avatars/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = (params as { _splat?: string })._splat ?? "";
        if (!PATH_RE.test(path)) return new Response("Not found", { status: 404 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("avatars").download(path);
        if (error || !data) return new Response("Not found", { status: 404 });

        return new Response(await data.arrayBuffer(), {
          headers: {
            "content-type": data.type || "image/webp",
            "cache-control": "public, max-age=60",
          },
        });
      },
    },
  },
});
