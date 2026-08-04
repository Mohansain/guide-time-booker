import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "list_available_slots",
  title: "List available slots",
  description: "List upcoming available mentoring slots, optionally for one mentor.",
  inputSchema: {
    mentor_id: z.string().uuid().optional().describe("Only slots for this mentor id."),
    limit: z.number().int().min(1).max(50).optional().describe("Maximum slots to return (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ mentor_id, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated");
    const supabase = supabaseForUser(ctx);
    const today = new Date().toISOString().slice(0, 10);
    let query = supabase
      .from("slots")
      .select("id, date, start_time, end_time, status, mentor:mentors(id, specialization, profile:profiles(name))")
      .eq("status", "AVAILABLE")
      .gte("date", today)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true })
      .limit(limit ?? 20);
    if (mentor_id) query = query.eq("mentor_id", mentor_id);

    const { data, error } = await query;
    if (error) return errorResult(error.message);
    return { ...textResult(JSON.stringify(data, null, 2)), structuredContent: { slots: data ?? [] } };
  },
});
