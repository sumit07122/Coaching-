# FIXIA CoachingOS — Phase 12: Migration Map & Dependency Matrix
**Document Version:** 1.0.0  
**Phase:** 12.1 — Database Re-verification & Migration Planning  
**Role:** Senior Supabase/PostgreSQL Database Architect  
**Status:** Approved Migration Roadmap (No schema changes applied yet)  

---

## 1. Migration History & Lineage Map

The database migrations follow a strict chronological and dependency-managed lineage:

```
[20261103000001_core_schema.sql]
  │
  ├──> [20261103000002_multi_tenant_rls.sql]
  │      │
  │      ├──> [20261103000003_auth_onboarding_and_security.sql]
  │      │      │
  │      │      └──> [20261103000004_storage_and_security_hardening.sql]
  │      │             │
  │      │             └──> [20261103000005_commercial_configuration.sql]
  │      │                    │
  │      v                    v
  │    [20261103000006_teacher_rls_and_platform_admin.sql]  <-- Phase 12 (Planned)
  │      │
  └──────┴──────────────────> [20261103000007_expenses_schedules_transfers.sql]  <-- Phase 12 (Planned)
```

---

## 2. Complete Migration Inventory & Dependency Matrix

| Migration File | Primary Objects Created / Modified | Upstream Dependencies | Breaking Change Risk | Status |
| :--- | :--- | :--- | :---: | :---: |
| `001_core_schema.sql` | 10 core tables (`institutes`, `profiles`, `memberships`, `batches`, `students`, `attendance_sessions`, `attendance_records`, `fee_plans`, `payments`, `audit_logs`, `commercial_subscriptions`). Indexes on `institute_id`. | None | **None** | **Applied & Verified** |
| `002_multi_tenant_rls.sql` | Functions `get_user_role`, `user_belongs_to_institute`. RLS enabled on all 10 tables with baseline member/owner policies. | `001` | **None** | **Applied & Verified** |
| `003_auth_onboarding_and_security.sql` | Trigger `handle_new_user` on `auth.users`. RPCs: `onboard_institute`, `update_institute_profile`, `get_current_user_context`. | `001`, `002` | **None** | **Applied & Verified** |
| `004_storage_and_security_hardening.sql` | Buckets `receipts`, `documents`, `avatars`. Storage RLS. Mutation guard trigger `prevent_cross_tenant_mutation` on `students`, `payments`, `batches`. | `001`, `002` | **None** | **Applied & Verified** |
| `005_commercial_configuration.sql` | Columns on `commercial_subscriptions` for 3 business models. Trigger `trg_check_student_quota` on `students`. Function `check_module_entitlement`. | `001`, `002` | **None** | **Applied & Verified** |
| `006_teacher_rls_and_platform_admin.sql` *(PLANNED)* | Table `platform_admins`. Functions `is_platform_super_admin`, `is_teacher_assigned_to_batch`. Constraint update on `memberships.role`. Tightened RLS on `batches`, `attendance_sessions`, `attendance_records`, `students`. Super Admin quota hardening. Batch-instructor sync trigger. | `001`, `002`, `003` | **Low / Additive** (Role constraint expands allowed values; RLS narrows faculty view to assigned classes) | **Planned for Phase 12.2** |
| `007_expenses_schedules_transfers.sql` *(PLANNED)* | Tables `expenses`, `batch_schedules`, `student_batch_transfers`. Trigger `trg_student_batch_transfer`. Stored procedure `create_staff_member`. | `001`, `002`, `006` | **Zero** (Purely additive tables and non-breaking triggers) | **Planned for Phase 12.2** |

---

## 3. Detailed Scope for Planned Migrations

### Migration 006: `20261103000006_teacher_rls_and_platform_admin.sql`
- **Dependencies:** Depends on `memberships`, `batches`, `attendance_sessions`, and `profiles` from Migration 001.
- **Detailed Execution Order:**
  1. Create `public.platform_admins` table and indexes.
  2. Define `public.is_platform_super_admin()` security definer function.
  3. Define `public.is_teacher_assigned_to_batch(UUID, UUID)` security definer function.
  4. Drop existing `memberships_role_check` constraint; recreate with `('owner', 'admin', 'staff', 'teacher', 'faculty')`.
  5. Drop loose RLS policies on `batches`, `attendance_sessions`, `attendance_records`, `students`.
  6. Apply sandboxed RLS policies restricting teachers to assigned cohorts.
  7. Drop loose policy allowing tenant owners to update `commercial_subscriptions`; replace with Super Admin only update policy.
  8. Create `sync_batch_instructor_membership` trigger on `batches`.

### Migration 007: `20261103000007_expenses_schedules_transfers.sql`
- **Dependencies:** Depends on `institutes`, `batches`, `students`, and `profiles` from Migration 001.
- **Detailed Execution Order:**
  1. Create `public.expenses` table, indexes, check constraints.
  2. Enable RLS on `public.expenses` with Owner/Admin-only policies.
  3. Create `public.batch_schedules` table, indexes, collision order check constraint.
  4. Enable RLS on `public.batch_schedules` with assigned-batch policy.
  5. Create `public.student_batch_transfers` table and indexes.
  6. Enable RLS on `public.student_batch_transfers`.
  7. Create `trg_student_batch_transfer` trigger on `students.batch_id`.
  8. Create stored procedure `public.create_staff_member(...)`.

---

## 4. Impact Analysis on Application Code & Dual Runtime

### 4.1 TypeScript Types (`src/types/index.ts`)
- **Additions:**
  - `Expense` interface (`id`, `instituteId`, `expenseNumber`, `category`, `amount`, `expenseDate`, `paidTo`, `paymentMethod`, `status`, `notes`).
  - `BatchSchedule` interface (`id`, `instituteId`, `batchId`, `dayOfWeek`, `startTime`, `endTime`, `room`).
  - `StudentBatchTransfer` interface (`id`, `instituteId`, `studentId`, `fromBatchId`, `toBatchId`, `transferDate`, `reason`).
- **Compatibility:** All existing types remain unchanged; new types are non-breaking additions.

### 4.2 Data-Access Service Layer (`src/services/supabaseData.ts`)
- **Additions:**
  - Mappers: `mapExpenseFromDb`, `mapExpenseToDb`, `mapScheduleFromDb`, `mapScheduleToDb`.
  - Queries: `fetchExpenses(instituteId)`, `fetchBatchSchedules(batchId)`, `fetchTeacherBatches(userId)`.
  - Mutations: `dbCreateExpense`, `dbVoidExpense`, `dbCreateSchedule`, `dbDeleteSchedule`, `dbCreateStaffMember`.
- **Offline / Mock Data Compatibility:**
  - New mock datasets added to `src/data/mockData.ts`: `INITIAL_EXPENSES`, `INITIAL_BATCH_SCHEDULES`.
  - Ensures unit tests run offline with zero network dependency.

---

## 5. Implementation Checklist for Next Prompt (Phase 12.2)

- [ ] **Step 1: Write Migration 006** (`supabase/migrations/20261103000006_teacher_rls_and_platform_admin.sql`) containing:
  - `platform_admins` table.
  - `is_platform_super_admin()` & `is_teacher_assigned_to_batch()` functions.
  - Role check constraint update on `memberships`.
  - Sandboxed RLS policies on `batches`, `attendance_sessions`, `attendance_records`, and `students`.
  - Super Admin quota enforcement on `commercial_subscriptions`.
  - Instructor batch sync trigger.
- [ ] **Step 2: Write Migration 007** (`supabase/migrations/20261103000007_expenses_schedules_transfers.sql`) containing:
  - `expenses` table with financial checks and RLS.
  - `batch_schedules` table with time-order checks and RLS.
  - `student_batch_transfers` table and auto-log trigger on `students.batch_id`.
  - Stored procedure `create_staff_member()`.
- [ ] **Step 3: Update `supabase/schema.sql`** to maintain unified synchronization.
- [ ] **Step 4: Update TypeScript Interfaces & Mock Data Fixtures** in `src/types/index.ts` and `src/data/mockData.ts`.
- [ ] **Step 5: Expand `src/services/supabaseData.ts`** with new mappers and database query/mutation functions.
- [ ] **Step 6: Write Automated Integration & Policy Tests** in `src/tests/` to verify:
  - Teacher cannot read unassigned batches.
  - Teacher cannot insert attendance in unassigned batches.
  - Teacher cannot read expenses or payments.
  - Student batch transfer trigger records historical entry.
  - Expenses calculate net profit accurately.
- [ ] **Step 7: Verify Full Test Suite & Production Build** (`vitest run --run` and `npm run build`).
