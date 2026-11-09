-- ==============================================================================
-- FIXIA CoachingOS — Migration 007: Expenses, Batch Schedules & Student Transfers
-- ==============================================================================

-- 1. Create Institute Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL CHECK (
        category IN ('rent', 'salaries', 'utilities', 'stationery', 'marketing', 'maintenance', 'software', 'other')
    ),
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    title VARCHAR(255) NOT NULL,
    recipient VARCHAR(255),
    payment_mode VARCHAR(32) NOT NULL DEFAULT 'upi' CHECK (
        payment_mode IN ('cash', 'upi', 'bank_transfer', 'cheque', 'card', 'other')
    ),
    reference_number VARCHAR(100),
    notes TEXT,
    receipt_voucher_url TEXT,
    created_by UUID REFERENCES public.profiles(id),
    is_voided BOOLEAN NOT NULL DEFAULT FALSE,
    voided_at TIMESTAMPTZ,
    voided_by UUID REFERENCES public.profiles(id),
    void_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance & analytics
CREATE INDEX IF NOT EXISTS idx_expenses_institute_date ON public.expenses (institute_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_institute_category ON public.expenses (institute_id, category);

-- Trigger to prevent cross-tenant mutation on expenses
DROP TRIGGER IF EXISTS trg_prevent_cross_tenant_expenses ON public.expenses;
CREATE TRIGGER trg_prevent_cross_tenant_expenses
    BEFORE UPDATE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION public.prevent_cross_tenant_update();

-- Row Level Security for Expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Expenses select policy: Owners and Admins only" ON public.expenses;
CREATE POLICY "Expenses select policy: Owners and Admins only"
    ON public.expenses FOR SELECT
    USING (
        public.is_platform_super_admin()
        OR public.get_user_role(institute_id) IN ('owner', 'admin')
    );

DROP POLICY IF EXISTS "Expenses insert policy: Owners and Admins only" ON public.expenses;
CREATE POLICY "Expenses insert policy: Owners and Admins only"
    ON public.expenses FOR INSERT
    WITH CHECK (
        public.get_user_role(institute_id) IN ('owner', 'admin')
    );

DROP POLICY IF EXISTS "Expenses update policy: Owners and Admins only" ON public.expenses;
CREATE POLICY "Expenses update policy: Owners and Admins only"
    ON public.expenses FOR UPDATE
    USING (
        public.get_user_role(institute_id) IN ('owner', 'admin')
    )
    WITH CHECK (
        public.get_user_role(institute_id) IN ('owner', 'admin')
    );
-- Note: Hard DELETE is intentionally disallowed to preserve financial audit trail (voiding only).


-- 2. Create Batch Schedules & Classroom Allocation Table
CREATE TABLE IF NOT EXISTS public.batch_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 1=Monday... 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_number VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_schedule_time_order CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_schedules_batch ON public.batch_schedules (batch_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_schedules_room ON public.batch_schedules (institute_id, room_number, day_of_week);

-- Room double-booking / collision prevention trigger
CREATE OR REPLACE FUNCTION public.check_room_schedule_collision()
RETURNS TRIGGER AS $$
DECLARE
    v_conflict_count INTEGER;
BEGIN
    IF NEW.room_number IS NOT NULL AND BTRIM(NEW.room_number) <> '' AND NEW.is_active = TRUE THEN
        SELECT COUNT(*) INTO v_conflict_count
        FROM public.batch_schedules
        WHERE institute_id = NEW.institute_id
          AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
          AND room_number = NEW.room_number
          AND day_of_week = NEW.day_of_week
          AND is_active = TRUE
          AND (
              (start_time, end_time) OVERLAPS (NEW.start_time, NEW.end_time)
          );

        IF v_conflict_count > 0 THEN
            RAISE EXCEPTION 'ERR_ROOM_COLLISION: Room "%" is already scheduled on day % during this time slot.',
                NEW.room_number, NEW.day_of_week;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_room_collision ON public.batch_schedules;
CREATE TRIGGER trg_check_room_collision
    BEFORE INSERT OR UPDATE ON public.batch_schedules
    FOR EACH ROW EXECUTE FUNCTION public.check_room_schedule_collision();

-- Row Level Security for Batch Schedules
ALTER TABLE public.batch_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Schedules select policy: Admins and assigned teachers" ON public.batch_schedules;
CREATE POLICY "Schedules select policy: Admins and assigned teachers"
    ON public.batch_schedules FOR SELECT
    USING (
        public.is_platform_super_admin()
        OR public.get_user_role(institute_id) IN ('owner', 'admin')
        OR public.is_teacher_assigned_to_batch(institute_id, batch_id)
    );

DROP POLICY IF EXISTS "Schedules write policy: Owners and Admins only" ON public.batch_schedules;
CREATE POLICY "Schedules write policy: Owners and Admins only"
    ON public.batch_schedules FOR ALL
    USING (
        public.get_user_role(institute_id) IN ('owner', 'admin')
    )
    WITH CHECK (
        public.get_user_role(institute_id) IN ('owner', 'admin')
    );


-- 3. Create Student Batch Transfer History Table
CREATE TABLE IF NOT EXISTS public.student_batch_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    from_batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
    to_batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
    transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reason TEXT,
    transferred_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transfers_student ON public.student_batch_transfers (student_id, transfer_date DESC);
CREATE INDEX IF NOT EXISTS idx_transfers_institute ON public.student_batch_transfers (institute_id);

-- Auto-audit trigger when student.batch_id changes
CREATE OR REPLACE FUNCTION public.log_student_batch_transfer()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.batch_id IS DISTINCT FROM NEW.batch_id THEN
        INSERT INTO public.student_batch_transfers (
            institute_id,
            student_id,
            from_batch_id,
            to_batch_id,
            transfer_date,
            transferred_by
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

DROP TRIGGER IF EXISTS trg_auto_log_student_batch_transfer ON public.students;
CREATE TRIGGER trg_auto_log_student_batch_transfer
    AFTER UPDATE OF batch_id ON public.students
    FOR EACH ROW EXECUTE FUNCTION public.log_student_batch_transfer();

-- Row Level Security for Student Batch Transfers
ALTER TABLE public.student_batch_transfers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Transfers select policy: Institute members" ON public.student_batch_transfers;
CREATE POLICY "Transfers select policy: Institute members"
    ON public.student_batch_transfers FOR SELECT
    USING (
        public.is_platform_super_admin()
        OR public.user_belongs_to_institute(institute_id)
    );

DROP POLICY IF EXISTS "Transfers insert policy: Owners and Admins only" ON public.student_batch_transfers;
CREATE POLICY "Transfers insert policy: Owners and Admins only"
    ON public.student_batch_transfers FOR INSERT
    WITH CHECK (
        public.get_user_role(institute_id) IN ('owner', 'admin')
    );


-- 4. Stored Procedures: Staff Provisioning & Management
CREATE OR REPLACE FUNCTION public.create_staff_member(
    p_institute_id UUID,
    p_email VARCHAR,
    p_full_name VARCHAR,
    p_role VARCHAR DEFAULT 'teacher',
    p_assigned_batches JSONB DEFAULT '[]'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_caller_role VARCHAR;
    v_target_user_id UUID;
BEGIN
    -- Verify caller is Owner or Admin in the institute
    v_caller_role := public.get_user_role(p_institute_id);
    IF v_caller_role NOT IN ('owner', 'admin') AND NOT public.is_platform_super_admin() THEN
        RAISE EXCEPTION 'ERR_UNAUTHORIZED: Only institute owners and admins can provision staff members.';
    END IF;

    -- Validate role
    IF p_role NOT IN ('teacher', 'faculty', 'staff', 'admin') THEN
        RAISE EXCEPTION 'ERR_INVALID_ROLE: Role "%" is not a valid staff role.', p_role;
    END IF;

    -- Look up existing profile by email
    SELECT id INTO v_target_user_id
    FROM public.profiles
    WHERE LOWER(email) = LOWER(p_email);

    -- If profile does not exist yet, create a stub profile
    IF v_target_user_id IS NULL THEN
        INSERT INTO public.profiles (email, full_name)
        VALUES (LOWER(p_email), p_full_name)
        RETURNING id INTO v_target_user_id;
    END IF;

    -- Upsert membership
    INSERT INTO public.memberships (
        institute_id,
        user_id,
        role,
        assigned_batches,
        is_active
    ) VALUES (
        p_institute_id,
        v_target_user_id,
        p_role,
        COALESCE(p_assigned_batches, '[]'::jsonb),
        TRUE
    )
    ON CONFLICT (institute_id, user_id) DO UPDATE SET
        role = EXCLUDED.role,
        assigned_batches = EXCLUDED.assigned_batches,
        is_active = TRUE,
        updated_at = NOW();

    -- Log to audit trail
    INSERT INTO public.audit_logs (
        institute_id,
        user_id,
        action,
        entity_type,
        entity_id,
        new_data
    ) VALUES (
        p_institute_id,
        auth.uid(),
        'STAFF_PROVISIONED',
        'membership',
        v_target_user_id,
        jsonb_build_object(
            'email', p_email,
            'full_name', p_full_name,
            'role', p_role,
            'assigned_batches', p_assigned_batches
        )
    );

    RETURN v_target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. Stored Procedure: Deactivate Staff Member
CREATE OR REPLACE FUNCTION public.deactivate_staff_member(
    p_institute_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_caller_role VARCHAR;
    v_target_role VARCHAR;
BEGIN
    v_caller_role := public.get_user_role(p_institute_id);
    IF v_caller_role NOT IN ('owner', 'admin') AND NOT public.is_platform_super_admin() THEN
        RAISE EXCEPTION 'ERR_UNAUTHORIZED: Only institute owners and admins can deactivate staff.';
    END IF;

    -- Ensure caller cannot deactivate themselves
    IF auth.uid() = p_user_id THEN
        RAISE EXCEPTION 'ERR_SELF_DEACTIVATION: You cannot deactivate your own account.';
    END IF;

    -- Ensure target is not the owner
    SELECT role INTO v_target_role
    FROM public.memberships
    WHERE institute_id = p_institute_id AND user_id = p_user_id;

    IF v_target_role = 'owner' THEN
        RAISE EXCEPTION 'ERR_CANNOT_DEACTIVATE_OWNER: The institute owner cannot be deactivated.';
    END IF;

    UPDATE public.memberships
    SET is_active = FALSE,
        updated_at = NOW()
    WHERE institute_id = p_institute_id AND user_id = p_user_id;

    -- Log to audit trail
    INSERT INTO public.audit_logs (
        institute_id,
        user_id,
        action,
        entity_type,
        entity_id,
        new_data
    ) VALUES (
        p_institute_id,
        auth.uid(),
        'STAFF_DEACTIVATED',
        'membership',
        p_user_id,
        jsonb_build_object('is_active', FALSE)
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. Stored Procedure: Explicit Student Batch Transfer with Reason
CREATE OR REPLACE FUNCTION public.transfer_student_batch(
    p_institute_id UUID,
    p_student_id UUID,
    p_new_batch_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_caller_role VARCHAR;
    v_old_batch_id UUID;
BEGIN
    v_caller_role := public.get_user_role(p_institute_id);
    IF v_caller_role NOT IN ('owner', 'admin') AND NOT public.is_platform_super_admin() THEN
        RAISE EXCEPTION 'ERR_UNAUTHORIZED: Only institute owners and admins can transfer students.';
    END IF;

    SELECT batch_id INTO v_old_batch_id
    FROM public.students
    WHERE id = p_student_id AND institute_id = p_institute_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ERR_STUDENT_NOT_FOUND: Student does not exist in this institute.';
    END IF;

    IF v_old_batch_id IS NOT DISTINCT FROM p_new_batch_id THEN
        RETURN TRUE; -- No transfer required
    END IF;

    -- Update student batch
    UPDATE public.students
    SET batch_id = p_new_batch_id,
        updated_at = NOW()
    WHERE id = p_student_id AND institute_id = p_institute_id;

    -- Insert transfer record with detailed reason
    INSERT INTO public.student_batch_transfers (
        institute_id,
        student_id,
        from_batch_id,
        to_batch_id,
        transfer_date,
        reason,
        transferred_by
    ) VALUES (
        p_institute_id,
        p_student_id,
        v_old_batch_id,
        p_new_batch_id,
        CURRENT_DATE,
        p_reason,
        auth.uid()
    );

    -- Log to audit trail
    INSERT INTO public.audit_logs (
        institute_id,
        user_id,
        action,
        entity_type,
        entity_id,
        new_data
    ) VALUES (
        p_institute_id,
        auth.uid(),
        'STUDENT_BATCH_TRANSFERRED',
        'student',
        p_student_id,
        jsonb_build_object(
            'from_batch_id', v_old_batch_id,
            'to_batch_id', p_new_batch_id,
            'reason', p_reason
        )
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

