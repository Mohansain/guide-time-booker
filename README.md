# Mentor Connect

Build a production-ready Full Stack Mentor Booking System with a modern, responsive UI.



Tech Stack:

- Frontend: React 19 + TypeScript + Vite

- Styling: Tailwind CSS + shadcn/ui

- Backend: Supabase

- Database: PostgreSQL (Supabase)

- Authentication: Clerk Authentication

- ORM: Supabase Client

- Email: Resend API

- Deployment: Vercel

- State Management: TanStack Query

- Form Validation: React Hook Form + Zod

- Date Picker: React Day Picker

- Calendar: FullCalendar

- Icons: Lucide React



---------------------------------------------------

PROJECT OVERVIEW

---------------------------------------------------



The application allows mentors to create available time slots and students to book mentoring sessions.



The UI should look modern, professional, responsive, and use a blue-indigo theme with smooth animations.



---------------------------------------------------

USER ROLES

---------------------------------------------------



There are two roles.



1. Mentor

2. Student



Role should be stored in the database and protected using Clerk Authentication.



---------------------------------------------------

MENTOR FEATURES

---------------------------------------------------



Mentor Dashboard



Mentor can



• Create available time slots

• Edit available slots

• Delete available slots

• View all upcoming sessions

• View completed sessions

• View cancelled sessions

• Cancel booked sessions

• Mark session as completed

• View student details

• Dashboard statistics



Statistics



Total Sessions



Upcoming



Completed



Cancelled



---------------------------------------------------

STUDENT FEATURES

---------------------------------------------------



Student Dashboard



Student can



Browse available slots



Search mentor



Filter by



Date



Time



Availability



Book slot



Cancel booking



View booking history



View upcoming bookings



View completed bookings



---------------------------------------------------

BOOKING RULES

---------------------------------------------------



One slot can only be booked by one student.



Once booked



Status changes to BOOKED.



No duplicate booking allowed.



Booking should happen inside a database transaction.



Prevent race conditions.



If two students try booking simultaneously



Only one booking succeeds.



The other receives



"This slot has already been booked."



---------------------------------------------------

EMAILS

---------------------------------------------------



Use Resend Email API.



After booking



Send confirmation email.



Email includes



Mentor name



Student name



Date



Time



Meeting ID



Cancellation policy



Reminder



Automatically send reminder email 1 hour before session.



Completed



Send Thank You email.



Cancelled



Send cancellation email.



---------------------------------------------------

EXTRA FEATURE

---------------------------------------------------



Implement Rating System.



After mentor marks session completed



Student can



Give



5-star rating



Write review



Mentor dashboard should display



Average rating



Total reviews



Recent reviews



---------------------------------------------------

BOOKING STATUS

---------------------------------------------------



AVAILABLE



BOOKED



CANCELLED



COMPLETED



EXPIRED



---------------------------------------------------

EDGE CASES

---------------------------------------------------



Handle all edge cases.



Two users booking simultaneously.



Student cancelling just before session.



Sessions passing without completion.



Expired sessions automatically become EXPIRED.



Past slots cannot be booked.



Cannot cancel completed sessions.



Cannot mark cancelled session completed.



---------------------------------------------------

DATABASE TABLES

---------------------------------------------------



profiles



id



role



name



email



avatar



created_at



mentors



id



profile_id



bio



specialization



experience



rating



slots



id



mentor_id



date



start_time



end_time



status



created_at



bookings



id



slot_id



student_id



mentor_id



status



booked_at



cancelled_at



completed_at



reviews



id



booking_id



mentor_id



student_id



rating



review



created_at



---------------------------------------------------

DASHBOARD UI

---------------------------------------------------



Mentor Dashboard



Sidebar



Dashboard



Slots



Bookings



Reviews



Settings



Student Dashboard



Sidebar



Dashboard



Find Mentors



My Bookings



Reviews



Profile



---------------------------------------------------

LANDING PAGE

---------------------------------------------------



Hero Section



Features



How it Works



Testimonials



FAQ



Contact



Footer



---------------------------------------------------

DESIGN

---------------------------------------------------



Use shadcn UI components.



Rounded cards



Soft shadows



Modern gradients



Dark Mode



Responsive



Loading Skeletons



Toast Notifications



Modal Dialogs



Professional animations



---------------------------------------------------

SECURITY

---------------------------------------------------



Use Clerk Authentication.



Protect all routes.



Enable Supabase Row Level Security.



Students can only access their own bookings.



Mentors can only manage their own slots.



---------------------------------------------------

ADMIN

---------------------------------------------------



Optional Admin Dashboard



Manage users



View bookings



Delete spam reviews



Analytics



---------------------------------------------------

README

---------------------------------------------------



Generate complete README with



Project Overview



Installation



Environment Variables



Database Setup



Running Project



Deployment



Folder Structure



Features



Future Improvements



---------------------------------------------------

DELIVERABLE

---------------------------------------------------



Generate complete production-ready project with



Responsive UI



Backend



Supabase SQL



Authentication



Email Integration



Protected Routes



Role-based Dashboard



Reusable Components



Error Handling



Loading States



Empty States



Clean Folder Structure



Production-quality code



No dummy logic.



Everything should be functional.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a24c3db9-c4e4-44aa-bc20-e6926dad21b3).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
