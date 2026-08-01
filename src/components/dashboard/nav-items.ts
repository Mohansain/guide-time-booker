import { CalendarDays, LayoutDashboard, MessageSquareQuote, Search, Settings, Star, User } from "lucide-react";
import type { NavItem } from "./dashboard-layout";

export const mentorNav: NavItem[] = [
  { label: "Dashboard", to: "/mentor", icon: LayoutDashboard },
  { label: "Slots", to: "/mentor/slots", icon: CalendarDays },
  { label: "Bookings", to: "/mentor/bookings", icon: MessageSquareQuote },
  { label: "Reviews", to: "/mentor/reviews", icon: Star },
  { label: "Settings", to: "/mentor/settings", icon: Settings },
];

export const studentNav: NavItem[] = [
  { label: "Dashboard", to: "/student", icon: LayoutDashboard },
  { label: "Find Mentors", to: "/student/mentors", icon: Search },
  { label: "My Bookings", to: "/student/bookings", icon: CalendarDays },
  { label: "Reviews", to: "/student/reviews", icon: Star },
  { label: "Profile", to: "/student/profile", icon: User },
];
