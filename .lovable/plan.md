

# University Event Hub - Complete Implementation Plan

## Project Summary
A full-featured event management platform for IUL University with a 3-tier role system, automatic domain-based role assignment, image uploads, and real-time announcements. Built for a polished hackathon demo.

---

## 🎨 Design System

| Element | Value |
|---------|-------|
| Primary Color | University Blue `#2563EB` |
| Background | White |
| Borders | Soft gray `#E5E7EB` |
| Border Radius | `rounded-xl` (friendly feel) |
| UI Library | Shadcn UI + Tailwind CSS |
| Feedback | Optimistic UI + Toast notifications |

---

## 👥 3-Tier Role System

### 1. Faculty Admin (`@iul.ac.in`)
- Full access to everything
- User Management: Promote students to Club President
- Delete any event
- Post announcements

### 2. Club President (Promoted by Admin)
- Create & manage their own events
- Approve/Reject registrations for their events
- Post announcements
- Cannot promote others or delete other's events

### 3. Student (`@student.iul.ac.in`)
- Browse and register for events
- View registration status
- Receive announcements
- View personal profile & history

---

## 🗄️ Database Schema

### Tables
1. **profiles** - User details (name, department, year, student_id, profile_completed)
2. **user_roles** - RBAC table (user_id, role enum: admin/president/student)
3. **events** - Event data (title, description, date, location, capacity, image_url, club_name, created_by)
4. **registrations** - Links users to events (user_id, event_id, status: pending/approved/rejected)
5. **announcements** - News feed (title, content, created_by, created_at)

### Security
- Row Level Security on all tables
- `has_role()` security definer function to prevent RLS recursion
- Storage bucket for event images with proper policies

---

## 📱 Pages & Features

### Public Pages
- **Landing Page** - Hero section with university imagery, sign in/up buttons
- **Auth Page** - Email/password with automatic role detection from domain

### Authenticated - All Roles
- **Complete Profile** - First-time user onboarding (blocks app access until done)
- **My Profile** - View personal info and registration history

### Student View
- **Home/Events** - Announcements feed + event grid with status badges
- **Event Details** - Full info + one-click registration
- **My Registrations** - Track all registrations and their statuses

### Club President View (includes Student features)
- **Dashboard** - Stats overview (my events, total registrations)
- **Create Event** - Rich form with image upload
- **Manage Events** - Table of created events
- **Participant Manager** - Slide-over drawer to approve/reject registrations
- **Post Announcement** - Create news feed items

### Faculty Admin View (includes all features)
- **Admin Dashboard** - Platform-wide stats
- **User Management** - Search users, promote to president
- **All Events** - View/delete any event across all clubs

---

## ✨ UX Details

### Optimistic UI
- Registration button shows "Pending" immediately before server confirms
- Approve/Reject updates instantly in the participant list

### Feedback
- Toast on every action: "Registration submitted!", "Event created!", "User promoted!"
- Error toasts with friendly messages

### Loading States
- Skeleton loaders for event cards and tables
- Button loading spinners during actions

### Status Badges
- ✅ **Approved** - Green badge
- ⏳ **Pending** - Yellow badge
- ❌ **Rejected** - Red badge

---

## 🚀 Implementation Order

1. **Database & Auth** - Supabase schema, RLS policies, auth flow
2. **Profile Completion** - Onboarding page with blocking redirect
3. **App Layout** - Sidebar navigation with role-based menus
4. **Event Cards & Grid** - Reusable components for browsing
5. **Registration Flow** - One-click register with status tracking
6. **Event Creation** - Form with image upload for presidents
7. **Participant Management** - Approve/reject drawer for presidents
8. **Announcements** - Create & display feed
9. **User Management** - Admin promote feature
10. **Polish** - Toasts, skeletons, edge cases

---

## 📋 Demo Flow (For Hackathon)

1. Show landing page → Sign up as student
2. Complete profile → Browse events → Register
3. Login as admin → Promote student to president
4. Login as president → Create event → Approve registrations
5. Show student sees "Approved" status

