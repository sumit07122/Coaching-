# FIXIA CoachingOS — Production Gap Analysis & Technical Audit
**Document Version:** 1.0.0  
**Phase:** 11 — Architecture & System Audit  
**Author:** Senior SaaS Product Architect & Principal Engineer  
**Status:** Approved Technical Audit Report  

---

## 1. Audit Scope & Methodology

An exhaustive technical audit of the FIXIA CoachingOS repository was conducted to inspect all aspects of the application:
1. **Frontend Codebase:** 50+ React components, 10 primary pages, custom CSS stylesheets, context providers, and hooks.
2. **Database Schema & Migrations:** Migrations `001` through `005` in `supabase/migrations/` and consolidated `supabase/schema.sql`.
3. **Data Access Layer:** Bidirectional mappers and mutation methods in `src/services/supabaseData.ts`.
4. **Security & Authorization:** Row Level Security (RLS) policies, client-side route guards, service-role leak detection, and role authority derivation.
5. **Test Suite:** 10 test files executed via `vitest run --run` (132 tests total).
6. **Build & Bundle Pipeline:** Production compilation executed via `tsc -b && vite build`.

---

## 2. What Is Genuinely Complete (Verified with Evidence)

The following capabilities are production-ready, fully implemented, and validated by automated tests and compilation checks:

| Capability | Implementation Evidence | Verification Status |
| :--- | :--- | :---: |
| **Multi-Tenant Foundation** | Every database table enforces `institute_id UUID NOT NULL REFERENCES institutes(id)`. | Verified in Migrations 001–005 |
| **Student Lifecycle Management** | Complete CRUD, search, status filtering (`Active`, `Archived`), and CSV exports. | Verified in `crud-modules.test.ts` |
| **Batch Management** | Create, edit, schedule, room allocation, capacity calculation, and student roster links. | Verified in `crud-modules.test.ts` |
| **Attendance Calculations** | Session roll-call, `Present`/`Absent`/`Late` metrics, percentage calculations. | Verified in `attendance-module.test.ts` |
| **Anti-Duplication Constraint** | Database unique constraint `(institute_id, batch_id, session_date)` prevents duplicate sessions. | Verified in `supabase-integration.test.ts` |
| **Fee Structures & Plans** | Standardized plans (Monthly, Quarterly, Annual, Full Course, Custom) with scholarship discounts. | Verified in `fee-management.test.ts` |
| **Payment Ledger Separation** | Strict separation: $\text{Balance} = \text{Invoiced} - \text{Paid}$. Negative or zero amounts rejected. | Verified in `calculations.test.ts` |
| **Official Receipt Issuance** | Sequential receipt numbering (`RCP-2026-XXXX`) with thermal & PDF print previews. | Verified in `fee-management.test.ts` |
| **Auditable Payment Reversals** | Owner-only reversal requiring mandatory justification, updating ledger balance and audit logs. | Verified in `fee-management.test.ts` |
| **Live Operational Dashboard** | Active students, batches, today's attendance %, monthly collection, and pending dues calculated dynamically without hardcoding. | Verified in `dashboard-reports-notifications.test.ts` |
| **In-App Notification Center** | Real-time alerts for overdue fees, upcoming dues, and institute announcements. | Verified in `dashboard-reports-notifications.test.ts` |
| **Dual Runtime Architecture** | Seamless fallback: 85-student offline demo baseline when unconfigured; PostgreSQL cloud when configured. | Verified in `AppContext.tsx` |
| **Service-Role Leak Guard** | Client-side JWT analyzer aborts application startup if a `service_role` secret is detected. | Verified in `supabase-auth.test.ts` |
| **Production Build Cleanliness** | TypeScript compiles with zero errors; Vite bundles production chunks in 3.08s. | Verified via `npm run build` |

---

## 3. What Is Partially Implemented (Identified Gaps)

These features exist in working order for single-user/demo workflows, but require architectural decoupling for the production multi-role split:

### Gap 1: Single Monolithic Navigation Layout
- **Current State:** `AppLayout.tsx` and `Sidebar.tsx` render the same navigation menu to all logged-in users regardless of role. When a teacher logs in, they still see sidebar items for *Dashboard*, *Fees & Receipts*, *Staff & Faculty*, and *Institute Settings*. Although `ProtectedRoute` blocks `/fees` upon clicking, displaying financial and administrative links to faculty is unacceptable in a commercial institute system.
- **Required Fix:** Split layout into `OwnerLayout` (full administrative navigation) and `TeacherLayout` (dedicated class attendance view).

### Gap 2: Over-Permissioned Database RLS on Batches & Attendance
- **Current State:** In `supabase/migrations/20261103000002_multi_tenant_rls.sql`:
  - `batches` SELECT policy allows any institute member to read all batches.
  - `attendance_sessions` ALL policy allows any institute member to insert or update attendance sessions for any batch.
- **Required Fix:** Update RLS policies so teachers can **only** read and mark attendance for batches where `instructor_user_id = auth.uid()` or batch id is contained in `memberships.assigned_batches`.

### Gap 3: Staff Account Provisioning in Supabase
- **Current State:** `Staff.tsx` allows an owner to add staff members in local React state, but does not invoke a Supabase mutation or RPC to create an authenticated user in `auth.users` and link them to `public.memberships`.
- **Required Fix:** Implement `create_staff_member` RPC function in PostgreSQL that provisions the auth user and membership atomically with assigned batches.

### Gap 4: Historical Attendance Roster Continuity on Student Transfers
- **Current State:** In `Attendance.tsx`, the roster for a past session is filtered by `students.filter(s => s.batchId === activeBatchId)`. If a student transfers to a new batch, reviewing older attendance records omits the transferred student from historical sessions.
- **Required Fix:** Roster lookup must include students who have recorded attendance entries in that session, even if their current batch has changed.

---

## 5. What Is Completely Missing

The following capabilities defined in the Phase 11 vision are not yet present in the codebase:

1. **Dedicated Teacher Class Attendance Portal (`/teacher/*`):**
   - High-speed, distraction-free class schedule and roll-call terminal tailored for mobile touch screens.
2. **Institute Expenses Tracking Module (`/owner/expenses`):**
   - Tracking institute operational expenditures: classroom rent, teacher honorariums, utility bills, stationery, marketing, and net profit calculations ($\text{Net Income} = \text{Fee Collections} - \text{Expenses}$).
3. **Formal Timetable & Classroom Allocation Engine:**
   - Dedicated scheduling module allocating physical rooms, recurring weekly time slots, and conflict resolution across batches.
4. **Isolated FIXIA Super Admin Platform Portal (`/superadmin/*`):**
   - Multi-tenant governance dashboard for platform operators to provision institutes, issue offline license keys, and enforce commercial quotas outside tenant reach.
5. **Live Supabase Credentials Injection:**
   - Supabase project `Coaching-` is created (`xruokhpngwzlodpgmsui`), awaiting `VITE_SUPABASE_ANON_KEY` insertion.

---

## 6. Exact Files Requiring Modification in Future Phases

### Files to Modify:
1. `src/App.tsx` — Split routing into `/owner/*`, `/teacher/*`, and `/superadmin/*`.
2. `src/components/layout/AppLayout.tsx` — Refactor into `OwnerLayout`.
3. `src/components/layout/Sidebar.tsx` — Filter navigation items based strictly on role permissions.
4. `src/pages/Attendance.tsx` — Separate Owner Attendance Analytics from Teacher Roll-Call.
5. `src/pages/Staff.tsx` — Connect staff creation to Supabase user provisioning.
6. `src/context/AuthContext.tsx` — Add role-based landing redirection (`/owner` vs `/teacher`).
7. `src/services/supabaseData.ts` — Add queries and mutations for expenses, timetables, and teacher-assigned batches.

### New Files to Create:
1. `src/components/layout/TeacherLayout.tsx` — Dedicated lightweight header and navigation for faculty.
2. `src/pages/TeacherClassOverview.tsx` — Teacher landing dashboard with today's class schedule.
3. `src/pages/TeacherAttendanceTerminal.tsx` — Fast, touch-friendly attendance roll-call terminal.
4. `src/pages/TeacherAttendanceHistory.tsx` — Teacher's historical attendance review.
5. `src/pages/Expenses.tsx` — Owner expense tracking and ledger balance sheet.
6. `src/pages/Timetable.tsx` — Classroom schedule and lecture time-slot manager.
7. `supabase/migrations/20261103000006_teacher_portal_and_rls_hardening.sql` — RLS tightening for teacher batch isolation.
8. `supabase/migrations/20261103000007_expenses_and_timetables.sql` — Tables for expenses, timetables, and historical transfers.

---

## 7. Security Risks & Vulnerability Summary

| Risk | Severity | Impact | Remediation Plan |
| :--- | :---: | :--- | :--- |
| **Teacher RLS Over-Permissioning** | **HIGH** | A rogue faculty account can query other batches and modify attendance sessions across the institute. | Enforce `is_teacher_assigned_to_batch(batch_id)` check in migration 006. |
| **Owner Self-Quota Tampering** | **MEDIUM** | In `Settings.tsx`, institute owners can adjust `studentLimit` and commercial models directly in state. | Move commercial subscription updates to Super Admin only; make `commercial_subscriptions` read-only for tenant owners. |
| **Student Roster PII Exposure** | **MEDIUM** | Teachers currently have access to student guardian phone numbers and addresses. | Mask student contact details in Teacher Attendance views (expose only name and student ID). |
| **Staff Auth Provisioning** | **LOW** | Adding staff in the UI does not currently create real auth credentials in PostgreSQL. | Implement transactional `create_staff_member` RPC with temporary passwords or invite links. |

---

## 8. Recommended Implementation Order

- **Phase 11 (Current):** System Audit, Technical Architecture & Specifications *(Completed)*.
- **Phase 12:** Database Schema Expansion & RLS Hardening (Migration 006 & 007).
- **Phase 13:** Dedicated Teacher Class Attendance Portal (`/teacher/*`).
- **Phase 14:** Institute Owner Enhancements (Expenses & Timetables).
- **Phase 15:** Platform Super Admin Separation & Governance.
- **Phase 16:** Final Integration, Security Testing & Production Deployment.

