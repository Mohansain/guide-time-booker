import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "list_mentors",
  title: "List mentors",
  description:
    "List mentors in the MentorLoop directory with their specialization, experience and rating. Optionally filter by a search term.",
  inputSchema: {
    search: z.string().trim().optional().describe("Filter by mentor name, specialization or bio."),
    limit: z.number().int().min(1).max(50).optional().describe("Maximum mentors to return (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated");
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("mentors")
      .select("id, specialization, experience, bio, rating, total_reviews, profile:profiles(name, email)")
      .order("rating", { ascending: false })
      .limit(limit ?? 20);
    if (error) return errorResult(error.message);

    const term = search?.toLowerCase();
    const rows = (data ?? []).filter((m) =>
      !term
        ? true
        : [m.specialization, m.bio, m.profile?.name, m.profile?.email]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(term)),
    );
    return { ...textResult(JSON.stringify(rows, null, 2)), structuredContent: { mentors: rows } };
  },
});
