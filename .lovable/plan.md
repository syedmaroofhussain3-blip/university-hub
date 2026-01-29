

# IUL Event Hub - Hackathon Project Description

## 📋 Project Overview

**IUL Event Hub** is a next-generation campus event management platform designed for IUL University. Built with a "Cosmic Glass Futurism" design language, it modernizes how students, club leaders, and faculty interact with campus events - from discovery to registration to management.

---

## 🎯 Problem Statement

University campuses struggle with:
- **Fragmented event communication** across WhatsApp groups, notice boards, and emails
- **Manual registration tracking** using spreadsheets and paper forms
- **No centralized payment verification** for paid events and tournaments
- **Lack of role-based access control** for different user types
- **Poor team formation** for hackathons and competitions

---

## 💡 Our Solution

A unified, role-aware platform that:
- Centralizes all campus events in one beautiful, responsive interface
- Automates registration workflows with team formation support
- Provides payment verification through receipt uploads
- Enables real-time status tracking for students
- Empowers club presidents with event management tools

---

## 🏗️ Core Architecture

### 3-Tier Role System (Automatic Domain Detection)

| Role | Email Domain | Capabilities |
|------|--------------|--------------|
| **Faculty Admin** | `@iul.ac.in` | Full access: User management, promote students, delete any event, post announcements |
| **Club President** | Promoted by Admin | Create events, manage registrations, approve teams, post announcements |
| **Student** | `@student.iul.ac.in` | Browse events, register (individual/team), track status, receive announcements |

### Database Schema
- **profiles** - User identity (name, department, year, student ID)
- **user_roles** - RBAC with enum (admin/president/student)
- **events** - Full event data with payment & team settings
- **teams** - Team registration with unique codes & logos
- **team_members** - Links users to teams
- **registrations** - Status tracking (pending/approved/rejected)
- **announcements** - Campus-wide news feed

---

## ✨ Current Features (MVP)

### For Students
- One-click event registration
- **Team Formation System**: Create team → Get unique code → Share with members
- Upload payment receipts for paid events
- Real-time registration status tracking
- Announcements news feed

### For Club Presidents
- Rich event creation form with image uploads
- **Team vs Individual** registration modes
- **Optional paid events** with UPI ID and QR code support
- Participant & team management dashboard
- Receipt verification for paid events
- Bulk approve/reject teams

### For Faculty Admins
- User search with role promotion/demotion
- Platform-wide event oversight
- Delete any event capability
- All president features included

### Design & UX
- **Cosmic Glass Futurism** theme (dark mode with aurora gradients)
- Glassmorphism UI with backdrop blur effects
- Framer Motion animations (scroll reveals, micro-interactions)
- Mobile-first responsive design with bottom navigation
- Optimistic UI updates with toast notifications

---

## 🚀 Upcoming Features (Roadmap)

### 1. Automated Payment System
**Vision**: Integrate with payment gateways for seamless in-app transactions.

- **Razorpay/UPI DeepLinks**: One-tap payment initiation
- **Automatic verification**: No manual receipt uploads needed
- **Refund management**: Handle cancellations gracefully
- **Split payments**: Support for team member cost-sharing
- **Payment history**: Track all transactions per user

**Impact**: Eliminates manual verification, reduces admin workload by 90%

---

### 2. Enhanced Event Registration Details
**Vision**: Make events information-rich and engaging.

- **Rich media attachments**: 
  - YouTube video embeds for event trailers
  - PDF brochures and rulebooks
  - External resource links (Google Forms, Notion pages)
- **Agenda timeline**: Hour-by-hour event schedule
- **Speaker profiles**: Photos and bios for seminars/workshops
- **Sponsor logos**: Showcase event partners
- **Live Q&A links**: Integration with Slido/Mentimeter

**Impact**: 50% reduction in "what's this event about?" queries

---

### 3. OTP & Enrollment Verification (University Database Sync)
**Vision**: Verify students against official university records.

- **Phone OTP verification**: Confirm mobile numbers
- **University enrollment sync**: 
  - API integration with university ERP/student database
  - Auto-fill student ID, department, year
  - Block unregistered users from signing up
- **Alumni verification**: Different access tier for graduated students
- **Faculty verification**: Cross-check with HR records

**Impact**: Eliminates fake accounts, ensures 100% verified users

---

### 4. Reminder Alarms & GitHub-Style Calendar
**Vision**: Never miss an event with proactive notifications.

**Reminder System**:
- Push notifications (web + mobile)
- Email reminders (1 day, 1 hour before)
- Custom reminder preferences per user
- WhatsApp integration (future scope)

**GitHub-Style Activity Calendar**:
- Visual heatmap of event participation
- Color intensity = number of events attended
- Contribution streaks for active students
- Year-in-review statistics
- Shareable activity cards for LinkedIn

**Calendar Features**:
- iCal export for Google/Apple Calendar sync
- Calendar view of upcoming events
- "Add to Calendar" one-click button
- Conflict detection with registered events

**Impact**: 40% increase in event attendance through timely reminders

---

## 🛠️ Technical Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Styling** | Tailwind CSS + Shadcn/UI |
| **Animations** | Framer Motion |
| **State** | TanStack React Query |
| **Backend** | Supabase (Auth + Database + Storage) |
| **Security** | Row Level Security (RLS) with SECURITY DEFINER functions |

---

## 📱 Demo Flow (For Judges)

1. **Landing Page** → Show cosmic design, responsive on mobile
2. **Sign Up as Student** → Email domain auto-detects role
3. **Complete Profile** → Onboarding flow
4. **Browse Events** → Glass cards with status badges
5. **Team Registration** → Create team, get code, share
6. **Login as Admin** → Promote student to president
7. **Create Event** → As president, with team + payment options
8. **Approve Teams** → View receipts, bulk approve
9. **Student Dashboard** → See "Approved" status update in real-time

---

## 💡 Innovation Highlights

1. **Domain-based RBAC** - No manual role assignment needed
2. **Unique Team Codes** - Database function generates 6-char codes
3. **Payment Receipt Workflow** - Bridge between external payments and in-app verification
4. **Optimistic UI** - Actions feel instant, network syncs in background
5. **Cosmic Design System** - Modern, engaging, not "boring enterprise"

---

## 🎯 Target Metrics (Post-Launch Goals)

- **50+ events/month** managed through platform
- **10,000+ active students** registered
- **<3 second** average registration time
- **90% reduction** in admin verification workload
- **40% increase** in event attendance via reminders

---

## 👥 Team

**[Your Team Name]**
- Built for IUL University
- Hackathon Submission 2026

---

*"Experience Campus Life at Warp Speed"* ✨

