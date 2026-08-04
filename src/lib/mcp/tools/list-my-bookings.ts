import { defineTool } from "@lovable.dev/mcp-js";
import { errorResult, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "list_my_bookings",
  title: "List my bookings",
  description: "List the signed-in user's mentoring bookings (as student or as mentor).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated");
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("bookings")
      .select(
        "id, status, booked_at, meeting_id, slot:slots(date, start_time, end_time), student:profiles!bookings_student_id_fkey(name, email), mentor:mentors(specialization, profile:profiles(name))",
      )
      .order("booked_at", { ascending: false })
      .limit(50);
    if (error) return errorResult(error.message);
    return { ...textResult(JSON.stringify(data, null, 2)), structuredContent: { bookings: data ?? [] } };
  },
});
