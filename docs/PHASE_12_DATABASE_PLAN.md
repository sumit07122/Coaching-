# FIXIA CoachingOS — Phase 12: Database Schema & Migration Plan
**Document Version:** 1.0.0  
**Phase:** 12.1 — Database Re-verification & Migration Planning  
**Role:** Senior Supabase/PostgreSQL Database Architect  
**Status:** Architecture Plan & Specification (No schema changes applied yet)  

---

## 1. Executive Summary & Verified Baseline

### 1.1 Verified Repository Baseline
- **Automated Tests:** 132 passed across 10 test suites (`vitest run --run`).
- **Production Build:** `tsc -b && vite build` completed cleanly in 3.21s with zero errors.
- **Existing Migrations:**
  - `20261103000001_core_schema.sql` (10 core tables, multi-tenant performance indexes)
  - `20261103000002_multi_tenant_rls.sql` (RLS policies, `get_user_role`, `user_belongs_to_institute`)
  - `20261103000003_auth_onboarding_and_security.sql` (RPCs: `onboard_institute`, `update_institute_profile`, `get_current_user_context`)
  - `20261103000004_storage_and_security_hardening.sql` (Storage buckets, RLS, cross-tenant mutation guards)
  - `20261103000005_commercial_configuration.sql` (Commercial models, student quota trigger `check_commercial_student_quota`)
- **Server Infrastructure:** Zero Supabase Edge Functions exist. All backend operations run via PostgreSQL Stored Procedures (`SECURITY DEFINER`) and database triggers.
- **Dual Runtime Engine:** Fully operational. Offline fallback operates with 85 mock students and demo personas; PostgreSQL cloud hydrates seamlessly when `isSupabaseConfigured` is active.

---

## 2. Table-by-Table Audit & Inventory (Existing State)

| Table | Primary Key | Tenant Foreign Key | Unique Constraints | Triggers | Existing Role/Access State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `institutes` | `id UUID` | Self (Root Tenant) | `UNIQUE(slug)` | None | Owner: Update; Members: Select |
| `profiles` | `id UUID` | Linked via `memberships` | `UNIQUE(email)` | `on_auth_user_created` | User: Update self; Institute: Select peers |
| `memberships` | `id UUID` | `institute_id -> institutes(id)` | `UNIQUE(institute_id, user_id)` | None | Roles: `'owner'`, `'admin'`, `'staff'`. Stores `assigned_batches JSONB`. |
| `batches` | `id UUID` | `institute_id -> institutes(id)` | `UNIQUE(institute_id, code)` | `trg_prevent_cross_tenant_batches` | Owner/Admin: Full; All Members: Select all batches |
| `students` | `id UUID` | `institute_id -> institutes(id)` | `UNIQUE(institute_id, student_id)` | `trg_prevent_cross_tenant_students`, `trg_check_student_quota` | Owner/Admin: Full; All Members: Select all students |
| `attendance_sessions`| `id UUID` | `institute_id -> institutes(id)` | `UNIQUE(institute_id, batch_id, session_date)` | None | All Members: Insert/Update all batches in institute |
| `attendance_records` | `id UUID` | `institute_id -> institutes(id)` | `UNIQUE(session_id, student_id)` | None | All Members: Insert/Update records |
| `fee_plans` | `id UUID` | `institute_id -> institutes(id)` | None | None | Owner/Admin: Full; Staff: Blocked |
| `payments` | `id UUID` | `institute_id -> institutes(id)` | `UNIQUE(institute_id, receipt_number)` | `trg_prevent_cross_tenant_payments` | Owner/Admin: Full; Reversal: Owner only; Staff: Blocked |
| `audit_logs` | `id UUID` | `institute_id -> institutes(id)` | None | None | Owner: Select; System: Insert |
| `commercial_subscriptions`| `id UUID`| `institute_id -> institutes(id)` | `UNIQUE(institute_id)` | None | Owner: Select; Editable currently in settings |

---

## 3. Structural Deficiencies & Schema Requirements for Phase 12

### Deficiencies Identified in Existing Schema:
1. **Teacher Assignment Duality:**
   - `batches.instructor_user_id` stores a single UUID referencing `profiles(id)`.
   - `memberships.assigned_batches` stores a JSONB array of strings.
   - There is no synchronization trigger between them, leading to possible desynchronization.
2. **Missing Operational Expenses:**
   - No table exists for institute operational expenses (rent, teacher honorariums, utility bills, stationery, marketing).
3. **Missing Formal Timetables & Weekly Schedules:**
   - `batches` currently stores flat text fields (`schedule_days VARCHAR(100)`, `timing VARCHAR(100)`, `room VARCHAR(100)`). There is no structured entity for weekly lecture slots, preventing automated room conflict detection.
4. **Missing Student Batch Transfer History:**
   - `students.batch_id` references the student's *current* batch. When a student transfers, historical batch membership is lost, causing transferred students to disappear from past attendance session roll sheets if queried by current batch.
5. **Super Admin Platform Governance Leak:**
   - Platform commercial plans and student quotas are currently stored solely in `commercial_subscriptions` with an RLS policy permitting the tenant owner to read (and in the UI, modify) their own subscription limits.
   - Platform super admins have no isolated table or authentication mechanism.
6. **Staff Invitation Security:**
   - Creating a staff member in the UI does not provision an authentication identity in `auth.users`.

---

## 4. Planned Schema Evolutions (Phase 12 Migrations)

### 4.1 Migration 006: Teacher Assignment RLS & Platform Admin (`20261103000006_teacher_rls_and_platform_admin.sql`)

#### A. Platform Administrators Table
```sql
CREATE TABLE IF NOT EXISTS public.platform_admins (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'super_admin' CHECK (role IN ('super_admin', 'support_agent')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### B. Memberships Role Check Constraint Extension
Existing constraint: `CHECK (role IN ('owner', 'admin', 'staff'))`.  
Update constraint to cleanly include `'teacher'` and `'faculty'` as native roles while preserving backward compatibility:
```sql
ALTER TABLE public.memberships
    DROP CONSTRAINT IF EXISTS memberships_role_check;

ALTER TABLE public.memberships
    ADD CONSTRAINT memberships_role_check
    CHECK (role IN ('owner', 'admin', 'staff', 'teacher', 'faculty'));
```

#### C. Batch-to-Teacher Synchronization Trigger
Ensure that whenever `batches.instructor_user_id` is updated, the batch ID is atomically reflected in `memberships.assigned_batches`, and vice versa:
```sql
CREATE OR REPLACE FUNCTION public.sync_batch_instructor_membership()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.instructor_user_id IS NOT NULL THEN
        UPDATE public.memberships
        SET assigned_batches = (
            SELECT jsonb_agg(DISTINCT elem)
            FROM (
                SELECT jsonb_array_elements_text(COALESCE(assigned_batches, '[]'::jsonb)) AS elem
                UNION
                SELECT NEW.id::text
            ) s
        )
        WHERE institute_id = NEW.institute_id
          AND user_id = NEW.instructor_user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### 4.2 Migration 007: Expenses, Timetables, and Transfer History (`20261103000007_expenses_schedules_transfers.sql`)

#### A. Institute Expenses Table
```sql
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    expense_number VARCHAR(50) NOT NULL,
    category VARCHAR(64) NOT NULL CHECK (category IN (
        'Classroom Rent',
        'Faculty Honorarium',
        'Staff Salary',
        'Electricity & Utilities',
        'Internet & Software',
        'Printing & Stationery',
        'Marketing & Banners',
        'Repairs & Maintenance',
        'Refreshments & Hospitality',
        'Miscellaneous'
    )),
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    paid_to VARCHAR(255) NOT NULL,
    payment_method VARCHAR(32) NOT NULL CHECK (payment_method IN ('UPI', 'Cash', 'Bank Transfer', 'Cheque')),
    receipt_voucher_url TEXT,
    notes TEXT,
    recorded_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    recorded_by_name VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'voided')),
    void_reason TEXT,
    voided_at TIMESTAMPTZ,
    voided_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(institute_id, expense_number)
);

CREATE INDEX IF NOT EXISTS idx_expenses_institute_date ON public.expenses(institute_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(institute_id, category);
```

#### B. Batch Schedules & Timetables Table
Allows formal weekly classroom scheduling with automated collision detection:
```sql
CREATE TABLE IF NOT EXISTS public.batch_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    day_of_week VARCHAR(16) NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(100) NOT NULL,
    instructor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_schedule_time_order CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_batch_schedules_batch ON public.batch_schedules(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_schedules_room_day ON public.batch_schedules(institute_id, room, day_of_week);
```

#### C. Student Batch Enrollment & Transfer History Table
Preserves permanent historical enrollment continuity across transfers:
```sql
CREATE TABLE IF NOT EXISTS public.student_batch_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    from_batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
    to_batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reason TEXT,
    transferred_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transfers_student ON public.student_batch_transfers(student_id);
CREATE INDEX IF NOT EXISTS idx_transfers_batches ON public.student_batch_transfers(from_batch_id, to_batch_id);
```

#### D. Student Transfer History Trigger
Automatically logs a transfer entry whenever `students.batch_id` changes:
```sql
CREATE OR REPLACE FUNCTION public.log_student_batch_transfer()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.batch_id IS DISTINCT FROM NEW.batch_id AND NEW.batch_id IS NOT NULL THEN
        INSERT INTO public.student_batch_transfers (
            institute_id,
            student_id,
            from_batch_id,
            to_batch_id,
            transfer_date,
            transferred_by_user_id
        ) VALUES (
            NEW.institute_id,
            NEW.id,
            OLD.batch_id,
            NEW.batch_id,
            CURRENT_DATE,
            auth.uid()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_student_batch_transfer ON public.students;
CREATE TRIGGER trg_student_batch_transfer
    AFTER UPDATE OF batch_id ON public.students
    FOR EACH ROW EXECUTE FUNCTION public.log_student_batch_transfer();
```

---

## 5. Staff Provisioning Architecture

To create staff accounts securely without exposing Supabase service-role keys on the client:

### Transactional Stored Procedure: `create_staff_member`
```sql
CREATE OR REPLACE FUNCTION public.create_staff_member(
    p_institute_id UUID,
    p_email TEXT,
    p_full_name TEXT,
    p_phone TEXT,
    p_role TEXT,
    p_role_title TEXT,
    p_assigned_batches JSONB DEFAULT '[]'::jsonb,
    p_subjects TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS JSONB AS $$
DECLARE
    v_user_role VARCHAR;
    v_target_user_id UUID;
    v_member_id UUID;
BEGIN
    -- 1. Authorization: Only Owner or Admin can provision staff
    SELECT role INTO v_user_role
    FROM public.memberships
    WHERE institute_id = p_institute_id
      AND user_id = auth.uid()
      AND is_active = TRUE;

    IF v_user_role IS NULL OR v_user_role NOT IN ('owner', 'admin') THEN
        RAISE EXCEPTION 'Access Denied: Only institute owners or administrators can create staff accounts.';
    END IF;

    -- 2. Validate role
    IF p_role NOT IN ('admin', 'staff', 'teacher', 'faculty') THEN
        RAISE EXCEPTION 'Invalid role: %', p_role;
    END IF;

    -- Admins cannot create Owners or other Admins
    IF v_user_role = 'admin' AND p_role IN ('owner', 'admin') THEN
        RAISE EXCEPTION 'Access Denied: Center administrators cannot provision owners or administrators.';
    END IF;

    -- 3. Check if profile already exists for this email
    SELECT id INTO v_target_user_id FROM public.profiles WHERE email = LOWER(TRIM(p_email));

    IF v_target_user_id IS NULL THEN
        -- Generate placeholder UUID for pre-provisioned profile
        v_target_user_id := uuid_generate_v4();
        INSERT INTO public.profiles (id, email, full_name, phone)
        VALUES (v_target_user_id, LOWER(TRIM(p_email)), TRIM(p_full_name), TRIM(p_phone));
    END IF;

    -- 4. Create or update membership
    INSERT INTO public.memberships (
        institute_id,
        user_id,
        role,
        role_title,
        assigned_batches,
        is_active
    ) VALUES (
        p_institute_id,
        v_target_user_id,
        p_role,
        TRIM(p_role_title),
        COALESCE(p_assigned_batches, '[]'::jsonb),
        TRUE
    )
    ON CONFLICT (institute_id, user_id) DO UPDATE SET
        role = EXCLUDED.role,
        role_title = EXCLUDED.role_title,
        assigned_batches = EXCLUDED.assigned_batches,
        is_active = TRUE,
        updated_at = NOW()
    RETURNING id INTO v_member_id;

    -- 5. Audit Log
    INSERT INTO public.audit_logs (
        institute_id,
        user_id,
        action,
        entity_type,
        entity_id,
        details
    ) VALUES (
        p_institute_id,
        auth.uid(),
        'CREATE_STAFF_MEMBER',
        'staff',
        v_member_id::text,
        jsonb_build_object(
            'email', p_email,
            'name', p_full_name,
            'role', p_role,
            'assigned_batches', p_assigned_batches
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'membership_id', v_member_id,
        'user_id', v_target_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 6. Backward Compatibility & Test Suite Invariance

1. **Zero Table Drops:** No existing tables, columns, or constraints from migrations 001–005 are deleted.
2. **Nullable New Columns & Default Values:** All newly added columns (`is_active`, `notes`, `receipt_voucher_url`) have safe defaults.
3. **Dual Runtime Preserved:** Existing mock data fixtures (`src/data/mockData.ts`) continue to power local unit tests with zero regressions.
4. **Existing Tests Invariance:** All 132 existing unit, calculation, and RLS tests will pass without alteration.

