# FIXIA CoachingOS — Sequential Implementation Roadmap
**Document Version:** 1.0.0  
**Phase:** 11 — Architecture & System Audit  
**Author:** Senior SaaS Product Architect & Principal Engineer  
**Status:** Approved Roadmap  

---

## 1. Roadmap Overview & Timeline

The roadmap transitions FIXIA CoachingOS from a unified single-portal application into a bifurcated commercial system with an **Institute Owner Management Portal**, a dedicated **Teacher Class Attendance Portal**, and platform-level **Super Admin Governance**.

```
+------------------------------------------------------------------------------------+
| Phase 11 (Current) : Architecture Blueprint & Comprehensive Technical Audit       |
| Status: COMPLETED (6 Architectural Specs Delivered)                                |
+------------------------------------------------------------------------------------+
                                          |
                                          v
+------------------------------------------------------------------------------------+
| Phase 12 : Database Schema Expansion & RLS Hardening                               |
| • Migration 006: Teacher Batch Sandboxing & RLS Hardening                          |
| • Migration 007: Expenses, Timetables, Batch Enrollment History                    |
+------------------------------------------------------------------------------------+
                                          |
                                          v
+------------------------------------------------------------------------------------+
| Phase 13 : Teacher Class Attendance Portal Implementation                          |
| • TeacherLayout & Mobile Navigation                                                |
| • Screen 1: Teacher Class Overview (/teacher)                                      |
| • Screen 2: High-Speed Roll-Call Terminal (/teacher/attendance/:batchId)           |
| • Screen 3: Teacher Attendance History (/teacher/history)                          |
+------------------------------------------------------------------------------------+
                                          |
                                          v
+------------------------------------------------------------------------------------+
| Phase 14 : Institute Owner Management Portal Enhancements                          |
| • Institute Expense Management (/owner/expenses) & Net Profit Reports             |
| • Timetable & Classroom Allocation (/owner/timetables)                             |
| • Real Staff Auth Provisioning via Database RPC                                    |
| • Historical Attendance Continuity on Student Batch Transfers                      |
+------------------------------------------------------------------------------------+
                                          |
                                          v
+------------------------------------------------------------------------------------+
| Phase 15 : FIXIA Super Admin Platform Separation                                   |
| • Decouple commercial quotas from tenant settings (read-only for owners)          |
| • Platform Super Admin Portal (/superadmin)                                        |
| • Multi-tenant licensing control plane & monitoring                                |
+------------------------------------------------------------------------------------+
                                          |
                                          v
+------------------------------------------------------------------------------------+
| Phase 16 : Final Production Verification & Launch                                  |
| • Live Supabase PostgreSQL Verification                                            |
| • Automated Security & Regression Suite (150+ tests)                               |
| • Vercel CI/CD Production Deployment                                               |
+------------------------------------------------------------------------------------+
```

---

## 2. Phase-by-Phase Execution Plan

### Phase 11: Architecture Blueprint & Technical Audit *(Completed)*
- **Objective:** Deep audit of existing repository, identification of gaps, verification of 132 tests, and generation of final architectural blueprints.
- **Deliverables:**
  - `docs/PRODUCT_VISION.md`
  - `docs/FINAL_ARCHITECTURE.md`
  - `docs/ROLE_PERMISSION_MATRIX.md`
  - `docs/ATTENDANCE_PORTAL_SPEC.md`
  - `docs/PRODUCTION_GAP_ANALYSIS.md`
  - `docs/IMPLEMENTATION_ROADMAP.md`
- **Output:** Complete architectural consensus before any code is modified.

---

### Phase 12: Database Schema Expansion & RLS Hardening
- **Objective:** Upgrade PostgreSQL database schema to support teacher batch sandboxing, institute expenses, formal timetables, and batch transfer histories.
- **Tasks:**
  1. Author `supabase/migrations/20261103000006_teacher_portal_and_rls_hardening.sql`:
     - Function `is_teacher_assigned_to_batch(batch_id)`.
     - Tighten `batches` SELECT policy to assigned instructors only.
     - Tighten `attendance_sessions` and `attendance_records` to assigned instructors only.
     - Strict financial isolation blocking faculty from `payments` and `fee_plans`.
  2. Author `supabase/migrations/20261103000007_expenses_and_timetables.sql`:
     - Table `public.expenses` (`id`, `institute_id`, `category`, `amount`, `date`, `paid_to`, `payment_method`, `receipt_url`, `recorded_by`).
     - Table `public.batch_schedules` (`id`, `institute_id`, `batch_id`, `day_of_week`, `start_time`, `end_time`, `room`).
     - Table `public.batch_enrollment_history` (`id`, `institute_id`, `student_id`, `batch_id`, `enrolled_from`, `enrolled_to`, `transfer_reason`).
  3. Synchronize `supabase/schema.sql` with new migrations.
  4. Write migration tests verifying that non-assigned teachers receive 0 rows for unassigned batches.

---

### Phase 13: Dedicated Teacher Class Attendance Portal
- **Objective:** Construct the dedicated, high-speed attendance interface for faculty.
- **Tasks:**
  1. Create `src/components/layout/TeacherLayout.tsx`:
     - Clean header displaying teacher name, date, assigned batch badges, and logout.
     - Zero financial or owner navigation links.
  2. Create `src/pages/TeacherClassOverview.tsx`:
     - List assigned batches with lecture times and today's attendance status (`Pending` vs `Completed`).
     - One-tap navigation to take attendance.
  3. Create `src/pages/TeacherAttendanceTerminal.tsx`:
     - 48px touch targets for `Present` (Green), `Absent` (Red), and `Late` (Amber).
     - **"Mark All Present"** button for sub-30-second roll calls.
     - Inline student remarks toggle.
     - Session notes field for topic covered.
     - Upsert submission preventing duplicate sessions.
  4. Create `src/pages/TeacherAttendanceHistory.tsx`:
     - Review past attendance rates and records by batch.
     - Absent student breakdown.
  5. Update `App.tsx` and `AuthContext.tsx` with role-aware route redirection.

---

### Phase 14: Institute Owner Management Portal Enhancements
- **Objective:** Fulfill all owner administrative requirements including expenses, timetables, and real staff account provisioning.
- **Tasks:**
  1. Create `src/pages/Expenses.tsx`:
     - Record institute overheads (Rent, Faculty payouts, Utilities, Marketing).
     - Category breakdown and monthly expense totals.
     - Real-time Net Profit Card: $\text{Net Income} = \text{Fee Collections} - \text{Total Expenses}$.
  2. Create `src/pages/Timetable.tsx`:
     - Visual weekly calendar grid of classroom allocations.
     - Conflict detector warning if two batches are scheduled in the same room at the same time.
  3. Connect `Staff.tsx` to Supabase:
     - Add `create_staff_member` database RPC provisioning auth user, profile, and membership atomically.
  4. Historical Attendance Preservation:
     - Update attendance roster lookup to join `attendance_records` so students transferred between batches remain on historical roll sheets.

---

### Phase 15: FIXIA Super Admin Separation & Governance
- **Objective:** Separate platform governance from tenant administration.
- **Tasks:**
  1. Remove editable commercial inputs from `Settings.tsx` (make student limit, subscription tier, and license status read-only for tenant owners).
  2. Create `src/pages/superadmin/SuperAdminDashboard.tsx`:
     - Tenant list across the platform.
     - Global license key generator and student limit updater.
     - Platform-level health diagnostics.

---

### Phase 16: Final Production Verification & Launch
- **Objective:** Comprehensive end-to-end verification and production deployment.
- **Tasks:**
  1. Connect live Supabase project credentials.
  2. Execute complete automated test suite (target: 150+ passing tests).
  3. Validate Vercel production deployment configuration (`vercel.json`).
  4. Deliver final operational handoff documentation.
