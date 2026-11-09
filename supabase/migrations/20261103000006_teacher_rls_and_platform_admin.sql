-- ==============================================================================
-- FIXIA CoachingOS — Migration 006: Teacher Assignment RLS & Platform Admin
-- ==============================================================================

-- 1. Create Platform Admins Table (Platform-Level Super Admins)
-- Isolated from tenant tables; governs licenses, subscriptions, and platform health.
CREATE TABLE IF NOT EXISTS public.platform_admins (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'super_admin' CHECK (role IN ('super_admin', 'support_agent')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can view admin list"
    ON public.platform_admins FOR SELECT
    USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid() AND pa.is_active = TRUE
    ));

-- 2. Helper Function: Verify if caller is a Platform Super Admin
CREATE OR REPLACE FUNCTION public.is_platform_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.platform_admins
        WHERE user_id = auth.uid()
          AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. Extend Memberships Role Constraint to natively include 'teacher' and 'faculty'
ALTER TABLE public.memberships
    DROP CONSTRAINT IF EXISTS memberships_role_check;

ALTER TABLE public.memberships
    ADD CONSTRAINT memberships_role_check
    CHECK (role IN ('owner', 'admin', 'staff', 'teacher', 'faculty'));

-- 4. Helper Function: Check whether a user/caller is authorized to access or manage a specific batch
CREATE OR REPLACE FUNCTION public.is_teacher_assigned_to_batch(p_institute_id UUID, p_batch_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_role VARCHAR;
    v_is_assigned BOOLEAN;
BEGIN
    -- Platform Super Admins have universal diagnostic read
    IF public.is_platform_super_admin() THEN
        RETURN TRUE;
    END IF;

    -- Institute Owners & Admins have global batch authority within their institute
    v_role := public.get_user_role(p_institute_id);
    IF v_role IN ('owner', 'admin') THEN
        RETURN TRUE;
    END IF;

    -- Verify active membership in the institute
    IF NOT public.user_belongs_to_institute(p_institute_id) THEN
        RETURN FALSE;
    END IF;

    -- Check direct instructor_user_id assignment OR inclusion in membership assigned_batches JSONB array
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 5. Batch-to-Teacher Synchronization Trigger
-- Automatically reflects instructor_user_id updates into memberships.assigned_batches
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

DROP TRIGGER IF EXISTS trg_sync_batch_instructor ON public.batches;
CREATE TRIGGER trg_sync_batch_instructor
    AFTER INSERT OR UPDATE OF instructor_user_id ON public.batches
    FOR EACH ROW EXECUTE FUNCTION public.sync_batch_instructor_membership();

-- 6. Tightened RLS on Batches: Teachers can ONLY SELECT assigned batches
DROP POLICY IF EXISTS "Institute members can view batches" ON public.batches;
DROP POLICY IF EXISTS "Batches select policy: Owners/Admins view all; Teachers view assigned only" ON public.batches;

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

-- 7. Tightened RLS on Attendance Sessions: Teachers can ONLY manage assigned batches
DROP POLICY IF EXISTS "Authorized staff can insert/update attendance sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Institute members can view attendance sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Attendance sessions select policy: Owners/Admins view all; Teachers view assigned only" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Attendance sessions write policy: Authorized teachers and admins only" ON public.attendance_sessions;

CREATE POLICY "Attendance sessions select policy: Owners/Admins view all; Teachers view assigned only"
    ON public.attendance_sessions FOR SELECT
    USING (
        public.is_platform_super_admin()
        OR public.get_user_role(institute_id) IN ('owner', 'admin')
        OR public.is_teacher_assigned_to_batch(institute_id, batch_id)
    );

CREATE POLICY "Attendance sessions write policy: Authorized teachers and admins only"
    ON public.attendance_sessions FOR ALL
    USING (
        public.get_user_role(institute_id) IN ('owner', 'admin')
        OR public.is_teacher_assigned_to_batch(institute_id, batch_id)
    )
    WITH CHECK (
        public.get_user_role(institute_id) IN ('owner', 'admin')
        OR public.is_teacher_assigned_to_batch(institute_id, batch_id)
    );

-- 8. Tightened RLS on Attendance Records: Teachers can ONLY mark records for assigned sessions
DROP POLICY IF EXISTS "Authorized staff can mark attendance records" ON public.attendance_records;
DROP POLICY IF EXISTS "Institute members can view attendance records" ON public.attendance_records;
DROP POLICY IF EXISTS "Attendance records select policy: Owners/Admins view all; Teachers view assigned only" ON public.attendance_records;
DROP POLICY IF EXISTS "Attendance records write policy: Assigned teachers and admins only" ON public.attendance_records;

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
        public.get_user_role(institute_id) IN ('owner', 'admin')
        OR EXISTS (
            SELECT 1 FROM public.attendance_sessions s
            WHERE s.id = attendance_records.session_id
              AND public.is_teacher_assigned_to_batch(s.institute_id, s.batch_id)
        )
    )
    WITH CHECK (
        public.get_user_role(institute_id) IN ('owner', 'admin')
        OR EXISTS (
            SELECT 1 FROM public.attendance_sessions s
            WHERE s.id = attendance_records.session_id
              AND public.is_teacher_assigned_to_batch(s.institute_id, s.batch_id)
        )
    );

-- 9. Tightened RLS on Students: Teachers can ONLY view students in their assigned cohorts
DROP POLICY IF EXISTS "Institute members can view students" ON public.students;
DROP POLICY IF EXISTS "Students select policy: Owners/Admins view all; Teachers view assigned cohorts only" ON public.students;

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

-- 10. Commercial Subscriptions Quota Lock: Read-only for Tenant Owners; Updates Super Admin Only
DROP POLICY IF EXISTS "Owners can update commercial subscription" ON public.commercial_subscriptions;
DROP POLICY IF EXISTS "Commercial subscription update policy: Platform Super Admins only" ON public.commercial_subscriptions;

CREATE POLICY "Commercial subscription update policy: Platform Super Admins only"
    ON public.commercial_subscriptions FOR ALL
    USING (public.is_platform_super_admin())
    WITH CHECK (public.is_platform_super_admin());
