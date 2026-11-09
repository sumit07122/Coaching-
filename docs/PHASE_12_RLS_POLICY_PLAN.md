# FIXIA CoachingOS — Phase 12: Row Level Security (RLS) Policy Plan
**Document Version:** 1.0.0  
**Phase:** 12.1 — Database Re-verification & Migration Planning  
**Role:** Senior Supabase/PostgreSQL Database Architect & Security Engineer  
**Status:** Architecture Specification (No schema changes applied yet)  

---

## 1. Threat Model & Security Objectives

In FIXIA CoachingOS, multi-tenant isolation and role privilege boundaries must be enforced at the **PostgreSQL database kernel level**. The frontend is an untrusted client environment; hiding navigation links or buttons in React does not constitute security.

### Core Security Objectives:
1. **Zero Cross-Tenant Leakage:** Institute A must never read, write, update, or delete records belonging to Institute B under any circumstances.
2. **Teacher Sandboxing:** A faculty member (e.g. Class 11 Chemistry Teacher) must **never**:
   - Access institute revenues, student fee dues, fee plans, or payments.
   - View student records, contact numbers, or addresses outside their assigned batches.
   - View schedules, lecture notes, or rosters of batches assigned to other teachers.
   - Insert or tamper with attendance roll sheets for batches they do not teach.
3. **Immutability of Financial History:**
   - Completed payments cannot be altered or hard-deleted.
   - Payment reversals require explicit Owner authorization, mandatory audit justifications, and are permanently recorded.
   - Expenses cannot be permanently deleted; they may only be voided by the Institute Owner.
4. **Platform Super Admin Governance:**
   - Platform Super Admins must be able to govern tenant subscription quotas and license keys across institutes without leaking private student PII.
   - Tenant Owners must be prevented from altering their own commercial quotas or license tiers.

---

## 2. Helper Functions Architecture

The following security definer functions form the foundation for all RLS policies in Phase 12:

### 2.1 Existing Functions (Maintained)
```sql
-- 1. Get calling user's active role in a specific institute
CREATE OR REPLACE FUNCTION public.get_user_role(inst_id UUID)
RETURNS VARCHAR AS $$
BEGIN
    RETURN (
        SELECT role FROM public.memberships
        WHERE institute_id = inst_id
          AND user_id = auth.uid()
          AND is_active = TRUE
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Verify caller is an active member of an institute
CREATE OR REPLACE FUNCTION public.user_belongs_to_institute(inst_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.memberships
        WHERE institute_id = inst_id
          AND user_id = auth.uid()
          AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2.2 New Functions to Introduce in Migration 006

#### A. Super Admin Verification Helper
```sql
CREATE OR REPLACE FUNCTION public.is_platform_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.platform_admins
        WHERE user_id = auth.uid()
          AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### B. Teacher Batch Assignment Verification Helper
Deterministically checks whether the calling user is authorized to manage or view a specific batch:
```sql
CREATE OR REPLACE FUNCTION public.is_teacher_assigned_to_batch(p_institute_id UUID, p_batch_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_role VARCHAR;
    v_is_assigned BOOLEAN;
BEGIN
    -- 1. Super Admins bypass
    IF public.is_platform_super_admin() THEN
        RETURN TRUE;
    END IF;

    -- 2. Institute Owners & Admins have global batch authority within their tenant
    v_role := public.get_user_role(p_institute_id);
    IF v_role IN ('owner', 'admin') THEN
        RETURN TRUE;
    END IF;

    -- 3. Check direct assignment on batch or within membership JSONB array
    SELECT (
        instructor_user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.memberships m
            WHERE m.institute_id = p_institute_id
              AND m.user_id = auth.uid()
              AND m.is_active = TRUE
              AND m.assigned_batches ? p_batch_id::text
        )
    ) INTO v_is_assigned
    FROM public.batches
    WHERE id = p_batch_id AND institute_id = p_institute_id;

    RETURN COALESCE(v_is_assigned, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 3. Table-by-Table Policy Audit & Target Policy Plan

### 3.1 `batches` (Cohorts & Classes)
- **Current Vulnerability:** `batches FOR SELECT USING (user_belongs_to_institute(institute_id))` allows any teacher to view all batches in the institute.
- **Target Policy Plan:**
```sql
DROP POLICY IF EXISTS "Institute members can view batches" ON public.batches;

CREATE POLICY "Batches select policy: Owners/Admins view all; Teachers view assigned only"
    ON public.batches FOR SELECT
    USING (
        public.is_platform_super_admin()
        OR public.get_user_role(institute_id) IN ('owner', 'admin')
        OR instructor_user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.memberships m
            WHERE m.institute_id = batches.institute_id
              AND m.user_id = auth.uid()
              AND m.is_active = TRUE
              AND m.assigned_batches ? batches.id::text
        )
    );

CREATE POLICY "Batches modification policy: Owners and Admins only"
    ON public.batches FOR ALL
    USING (public.get_user_role(institute_id) IN ('owner', 'admin'))
    WITH CHECK (public.get_user_role(institute_id) IN ('owner', 'admin'));
```

---

### 3.2 `attendance_sessions` (Roll-Call Sessions)
- **Current Vulnerability:** `attendance_sessions FOR ALL USING (user_belongs_to_institute(institute_id))` allows any teacher to record or tamper with attendance in batches they do not teach.
- **Target Policy Plan:**
```sql
DROP POLICY IF EXISTS "Authorized staff can insert/update attendance sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Institute members can view attendance sessions" ON public.attendance_sessions;

CREATE POLICY "Attendance sessions select policy: Owners/Admins view all; Teachers view assigned only"
    ON public.attendance_sessions FOR SELECT
    USING (
        public.is_platform_super_admin()
        OR public.get_user_role(institute_id) IN ('owner', 'admin')
        OR public.is_teacher_assigned_to_batch(institute_id, batch_id)
    );

CREATE POLICY "Attendance sessions write policy: Authorized teachers and admins only"
    ON public.attendance_sessions FOR ALL
    USING (public.is_teacher_assigned_to_batch(institute_id, batch_id))
    WITH CHECK (public.is_teacher_assigned_to_batch(institute_id, batch_id));
```

---

### 3.3 `attendance_records` (Individual Student Roll Marks)
- **Target Policy Plan:**
```sql
DROP POLICY IF EXISTS "Authorized staff can mark attendance records" ON public.attendance_records;
DROP POLICY IF EXISTS "Institute members can view attendance records" ON public.attendance_records;

CREATE POLICY "Attendance records select policy: Owners/Admins view all; Teachers view assigned only"
    ON public.attendance_records FOR SELECT
    USING (
        public.is_platform_super_admin()
        OR public.get_user_role(institute_id) IN ('owner', 'admin')
        OR EXISTS (
            SELECT 1 FROM public.attendance_sessions s
            WHERE s.id = attendance_records.session_id
              AND public.is_teacher_assigned_to_batch(s.institute_id, s.batch_id)
        )
    );

CREATE POLICY "Attendance records write policy: Assigned teachers and admins only"
    ON public.attendance_records FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.attendance_sessions s
            WHERE s.id = attendance_records.session_id
              AND public.is_teacher_assigned_to_batch(s.institute_id, s.batch_id)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.attendance_sessions s
            WHERE s.id = attendance_records.session_id
              AND public.is_teacher_assigned_to_batch(s.institute_id, s.batch_id)
        )
    );
```

---

### 3.4 `students` (Student Profiles & Enrollment)
- **Target Policy Plan:**
```sql
DROP POLICY IF EXISTS "Institute members can view students" ON public.students;

CREATE POLICY "Students select policy: Owners/Admins view all; Teachers view assigned cohorts only"
    ON public.students FOR SELECT
    USING (
        public.is_platform_super_admin()
        OR public.get_user_role(institute_id) IN ('owner', 'admin')
        OR (
            batch_id IS NOT NULL 
            AND public.is_teacher_assigned_to_batch(institute_id, batch_id)
        )
        OR EXISTS (
            SELECT 1 FROM public.attendance_records ar
            JOIN public.attendance_sessions asess ON ar.session_id = asess.id
            WHERE ar.student_id = students.id
              AND public.is_teacher_assigned_to_batch(asess.institute_id, asess.batch_id)
        )
    );

CREATE POLICY "Students management policy: Owners and Admins only"
    ON public.students FOR ALL
    USING (public.get_user_role(institute_id) IN ('owner', 'admin'))
    WITH CHECK (public.get_user_role(institute_id) IN ('owner', 'admin'));
```

---

### 3.5 `expenses` (New Table in Migration 007)
- **Target Policy Plan:**
```sql
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Expenses select policy: Owners and Admins only"
    ON public.expenses FOR SELECT
    USING (
        public.is_platform_super_admin()
        OR public.get_user_role(institute_id) IN ('owner', 'admin')
    );

CREATE POLICY "Expenses insert policy: Owners and Admins only"
    ON public.expenses FOR INSERT
    WITH CHECK (public.get_user_role(institute_id) IN ('owner', 'admin'));

CREATE POLICY "Expenses update/void policy: Only Owners can void expenses"
    ON public.expenses FOR UPDATE
    USING (public.get_user_role(institute_id) = 'owner')
    WITH CHECK (public.get_user_role(institute_id) = 'owner');

CREATE POLICY "Expenses delete policy: Prohibited (Audit Integrity)"
    ON public.expenses FOR DELETE
    USING (false); -- Hard deletions forbidden; records may only be voided
```

---

### 3.6 `batch_schedules` (New Table in Migration 007)
- **Target Policy Plan:**
```sql
ALTER TABLE public.batch_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Batch schedules select policy: Owners/Admins view all; Teachers view assigned only"
    ON public.batch_schedules FOR SELECT
    USING (
        public.is_platform_super_admin()
        OR public.get_user_role(institute_id) IN ('owner', 'admin')
        OR public.is_teacher_assigned_to_batch(institute_id, batch_id)
    );

CREATE POLICY "Batch schedules management policy: Owners and Admins only"
    ON public.batch_schedules FOR ALL
    USING (public.get_user_role(institute_id) IN ('owner', 'admin'))
    WITH CHECK (public.get_user_role(institute_id) IN ('owner', 'admin'));
```

---

### 3.7 `commercial_subscriptions` (Hardening Tenant Barrier)
- **Current Vulnerability:** Migration 002 permitted owners to update their own commercial subscription records: `USING (get_user_role(institute_id) = 'owner')`.
- **Target Policy Plan:** Make commercial subscriptions strictly **read-only** for tenant owners, editable exclusively by platform Super Admins:
```sql
DROP POLICY IF EXISTS "Owners can update commercial subscription" ON public.commercial_subscriptions;

CREATE POLICY "Commercial subscription update policy: Platform Super Admins only"
    ON public.commercial_subscriptions FOR ALL
    USING (public.is_platform_super_admin())
    WITH CHECK (public.is_platform_super_admin());
```

---

## 4. Policy Execution & Regression Verification Strategy

1. **Deterministic Multi-Tenant Barriers:** Every query path validates `institute_id` first before evaluating role functions.
2. **Automated Vitest Regression Tests:**
   - Test Teacher A attempting to select Batch B (Expect 0 rows).
   - Test Teacher A attempting to mark attendance in Batch B (Expect RLS violation exception).
   - Test Teacher A attempting to query `payments` or `expenses` (Expect 0 rows).
   - Test Institute Owner attempting to mutate `commercial_subscriptions.student_limit` (Expect permission denied).

