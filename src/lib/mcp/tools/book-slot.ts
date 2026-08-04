import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "book_slot",
  title: "Book a slot",
  description:
    "Book an available mentoring slot for the signed-in student. The booking is race-safe: an already booked slot is rejected.",
  inputSchema: { slot_id: z.string().uuid().describe("Id of the AVAILABLE slot to book.") },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ slot_id }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated");
    const supabase = supabaseForUser(ctx);
    const { error } = await supabase.rpc("book_slot", { _slot_id: slot_id });
    if (error) return errorResult(error.message);
    return textResult(`Slot ${slot_id} booked.`);
  },
});
