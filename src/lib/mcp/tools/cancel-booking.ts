import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "cancel_booking",
  title: "Cancel a booking",
  description: "Cancel one of the signed-in user's bookings and free the slot again.",
  inputSchema: { booking_id: z.string().uuid().describe("Id of the booking to cancel.") },
  annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  handler: async ({ booking_id }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated");
    const supabase = supabaseForUser(ctx);
    const { error } = await supabase.rpc("cancel_booking", { _booking_id: booking_id });
    if (error) return errorResult(error.message);
    return textResult(`Booking ${booking_id} cancelled.`);
  },
});
