import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listMentorsTool from "./tools/list-mentors";
import listAvailableSlotsTool from "./tools/list-available-slots";
import listMyBookingsTool from "./tools/list-my-bookings";
import bookSlotTool from "./tools/book-slot";
import cancelBookingTool from "./tools/cancel-booking";

// The OAuth issuer must be the direct Supabase host; the project ref is the only
// value that survives publish unchanged and Vite inlines it at build time.
const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "mentor-connect",
  title: "Mentor Connect",
  version: "0.1.0",
  instructions:
    "Tools for MentorLoop, a mentor booking app. Use `list_mentors` and `list_available_slots` to find mentoring availability, `book_slot` to book a slot for the signed-in student, `list_my_bookings` to review bookings, and `cancel_booking` to cancel one. All tools act as the signed-in user.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listMentorsTool, listAvailableSlotsTool, listMyBookingsTool, bookSlotTool, cancelBookingTool],
});
