

# Medical Center Management System - Implementation Plan

## Overview
A production-ready, enterprise-grade medical center management system with role-based access control, real-time data, and a clean clinical design aesthetic. Built with React, TypeScript, Tailwind CSS, and Supabase backend.

---

## Phase 1: Foundation & Authentication

### Design System Setup
- Centralized Tailwind theme with medical-grade colors
  - **Light mode**: White backgrounds, light gray surfaces, teal-blue accents
  - **Dark mode**: Soft slate/charcoal tones, muted blue highlights (no harsh blacks)
- System-aware dark mode with manual toggle and localStorage persistence
- Typography scale with accessible contrast ratios (WCAG AA compliant)
- Consistent spacing, shadows, and border-radius tokens

### Core Layout Components
- **Sidebar Navigation**: Collapsible with icon-only mini mode
  - Role-aware menu items (different menus per role)
  - Active route highlighting
- **Top Bar**: Search, user profile dropdown, theme toggle, notifications
- **Card-based content containers** with consistent styling

### Authentication System
- Supabase Auth integration with email/password
- User profiles table with:
  - Display name, avatar, contact info
  - Professional details (for doctors)
  - User preferences
- Secure role management in separate `user_roles` table
- Protected routes based on user role
- Login, signup, and password reset pages

---

## Phase 2: Dashboard & Core UI

### Role-Based Dashboards
**Administrator Dashboard:**
- Key metrics: Total patients, active doctors, today's appointments, monthly revenue
- Charts: Appointment trends, department distribution, revenue overview
- Recent activity feed
- Quick action buttons

**Doctor Dashboard:**
- Today's patient queue
- Upcoming appointments
- Recent patient notes
- Personal schedule overview

**Receptionist Dashboard:**
- Today's appointment calendar
- Check-in queue
- Recent patient registrations

**Patient Dashboard (if portal enabled):**
- Upcoming appointments
- Recent prescriptions
- Medical history summary

### Reusable Components
- Data tables with sorting, filtering, pagination
- Form components (inputs, selects, date pickers)
- Modals for confirmations and quick actions
- Toast notifications for feedback
- Loading skeletons and empty states

---

## Phase 3: Patient Management

### Patient Database
- Patients table with comprehensive fields:
  - Personal info, contact details, emergency contact
  - Insurance information
  - Medical history summary
  - Assigned primary doctor

### Patient List View
- Searchable, filterable table
- Status indicators (active, inactive)
- Quick actions (view, edit, schedule appointment)
- Pagination for large datasets

### Patient Profile Page
- Header with photo, name, key info
- Tabbed sections:
  - **Overview**: Summary, demographics, insurance
  - **Medical History**: Conditions, allergies, surgeries
  - **Appointments**: Past and upcoming
  - **Prescriptions**: Active and historical
  - **Documents**: Upload/view files
- Edit functionality with form validation

### Patient CRUD Operations
- Add new patient with multi-step form
- Edit patient information
- Soft delete with confirmation modal
- Activity logging for audit trail

---

## Phase 4: Doctors & Departments

### Doctors Management
- Doctor profiles with:
  - Specialties, qualifications, license number
  - Department assignment
  - Working hours/availability
  - Contact information
- Doctor list with filters (specialty, department, availability)
- Doctor detail page with assigned patients

### Department Management
- Department creation and editing
- Assign doctors to departments
- Department head assignment
- Service catalog per department

---

## Phase 5: Appointments System

### Appointment Scheduling
- **Calendar View**: Monthly/weekly/daily views
- **List View**: Filterable appointment table
- Status indicators: Scheduled, In Progress, Completed, Cancelled, No Show
- Color coding by department or doctor

### Booking Flow
- Select patient (or create new)
- Choose department and doctor
- Pick available time slot
- Add notes/reason for visit
- Confirmation with email notification setup

### Appointment Management
- Reschedule with conflict detection
- Cancellation with reason logging
- Check-in functionality for receptionists
- Visit duration tracking

---

## Phase 6: Medical Records

### Visit Records
- Timeline view of all patient visits
- Detailed visit notes with:
  - Chief complaint
  - Diagnosis (ICD codes if needed)
  - Treatment plan
  - Doctor's notes
- Link to prescriptions and lab orders

### Medical History
- Chronic conditions tracker
- Allergy management
- Immunization records
- Family history section

---

## Phase 7: Prescriptions

### Prescription Management
- Create prescriptions with multiple medicines
- Each medicine entry includes:
  - Drug name (with search/autocomplete)
  - Dosage and frequency
  - Duration
  - Special instructions
- Print-ready prescription format
- Prescription history per patient

---

## Phase 8: Billing & Invoices

### Services Catalog
- Add/edit billable services
- Price management
- Department association
- Tax configuration

### Invoice System
- Generate invoices from appointments
- Itemized billing with services
- Payment status: Pending, Partial, Paid, Overdue
- Payment recording
- Invoice PDF generation (print-ready)

---

## Technical Architecture

### Database Design
- Proper foreign key relationships
- Row Level Security (RLS) policies for all tables
- Security definer functions for role checks
- Indexes for performance on common queries

### Code Organization
```
src/
├── components/
│   ├── ui/          # Base shadcn components
│   ├── layout/      # Sidebar, TopBar, PageContainer
│   ├── dashboard/   # Dashboard widgets
│   ├── patients/    # Patient-specific components
│   ├── doctors/     # Doctor-specific components
│   └── shared/      # DataTable, Forms, Modals
├── pages/           # Route pages
├── hooks/           # Custom hooks
├── lib/             # Utilities, types
└── integrations/    # Supabase client
```

### Key Features
- Fully typed with TypeScript
- React Query for data fetching and caching
- Form validation with Zod
- Smooth page transitions
- Responsive design (desktop, tablet, mobile)
- Optimistic updates for better UX

---

## Delivery Approach

I'll build this incrementally, starting with **Phase 1-3** (Foundation, Dashboard, Patients) as these are your priority. Each phase will be fully functional and testable before moving to the next.

**Estimated phases:**
1. Foundation & Auth → Core layouts, theme, login system
2. Dashboard → Role-based dashboards with mock-ready structure
3. Patients → Full CRUD with search, filter, profiles
4. Remaining features → Built iteratively

Ready to begin with the foundation and authentication system?

