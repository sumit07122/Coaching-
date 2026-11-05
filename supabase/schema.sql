-- ==============================================================================
-- FIXIA CoachingOS — Unified Production Multi-Tenant Schema with RLS
-- PostgreSQL + Supabase Authentication & Multi-Tenant Isolation
-- Includes: profiles, institutes, memberships, audit_logs, commercial_subscriptions
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Institutes (Tenants)
CREATE TABLE IF NOT EXISTS public.institutes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    tagline VARCHAR(255),
    category VARCHAR(64) NOT NULL DEFAULT 'academic_k12',
    address TEXT,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(20),
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(255),
    director_name VARCHAR(255) NOT NULL,
    reg_number VARCHAR(100),
    academic_session VARCHAR(50) DEFAULT '2026-2027',
    currency_symbol VARCHAR(10) DEFAULT '₹',
    receipt_prefix VARCHAR(20) DEFAULT 'RCP-2026-',
    whatsapp_template TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Profiles (Linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY, -- References auth.users.id
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Memberships (Linking Users to Institutes with Roles: owner, admin, staff)
CREATE TABLE IF NOT EXISTS public.memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL CHECK (role IN ('owner', 'admin', 'staff')),
    role_title VARCHAR(100) NOT NULL,
    assigned_batches JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(institute_id, user_id)
);

-- 4. Batches
CREATE TABLE IF NOT EXISTS public.batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    course VARCHAR(255) NOT NULL,
    instructor_name VARCHAR(255),
    instructor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    schedule_days VARCHAR(100) NOT NULL,
    timing VARCHAR(100) NOT NULL,
    room VARCHAR(100),
    capacity INTEGER NOT NULL DEFAULT 20,
    monthly_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(32) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'upcoming')),
    start_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(institute_id, code)
);

-- 5. Students
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    student_id VARCHAR(50) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    guardian_name VARCHAR(255) NOT NULL,
    guardian_phone VARCHAR(30),
    guardian_relation VARCHAR(32) DEFAULT 'Father',
    email VARCHAR(255),
    address TEXT,
    course VARCHAR(255) NOT NULL,
    batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
    admission_date DATE NOT NULL DEFAULT CURRENT_DATE,
    gender VARCHAR(16) DEFAULT 'Male',
    status VARCHAR(32) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'alumni')),
    fee_status VARCHAR(32) DEFAULT 'overdue' CHECK (fee_status IN ('paid', 'partial', 'overdue')),
    total_fee_invoiced NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_fee_paid NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    balance_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    last_payment_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(institute_id, student_id)
);

-- 6. Attendance Sessions & Records
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    marked_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    total_enrolled INTEGER NOT NULL DEFAULT 0,
    total_present INTEGER NOT NULL DEFAULT 0,
    total_absent INTEGER NOT NULL DEFAULT 0,
    total_late INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(institute_id, batch_id, session_date)
);

CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL CHECK (status IN ('present', 'absent', 'late')),
    remarks TEXT,
    marked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, student_id)
);

-- 7. Fee Plans
CREATE TABLE IF NOT EXISTS public.fee_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    billing_frequency VARCHAR(32) NOT NULL CHECK (billing_frequency IN ('Monthly', 'Quarterly', 'Annual', 'Full Course', 'Custom')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Payments
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    receipt_number VARCHAR(50) NOT NULL,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(32) NOT NULL CHECK (payment_method IN ('UPI', 'Cash', 'Bank Transfer', 'Cheque')),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    collected_by_name VARCHAR(255) NOT NULL,
    collected_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    remarks TEXT,
    invoiced_amount NUMERIC(10, 2) NOT NULL,
    paid_amount_prior NUMERIC(10, 2) NOT NULL,
    balance_remaining NUMERIC(10, 2) NOT NULL,
    status VARCHAR(32) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'reversed')),
    reversal_reason TEXT,
    reversed_at TIMESTAMPTZ,
    reversed_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(institute_id, receipt_number)
);

-- 9. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(100),
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Commercial Subscriptions
CREATE TABLE IF NOT EXISTS public.commercial_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    model_type VARCHAR(32) NOT NULL CHECK (model_type IN ('saas_subscription', 'one_time_licence', 'custom_development')),
    plan_name VARCHAR(100) NOT NULL DEFAULT 'Growth Plan',
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'expired', 'trial')),
    subscription_status VARCHAR(32) DEFAULT 'active' CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'trial', 'expired', 'not_applicable')),
    licence_status VARCHAR(32) DEFAULT 'not_applicable' CHECK (licence_status IN ('active', 'expired', 'suspended', 'pending_activation', 'not_applicable')),
    billing_cycle VARCHAR(16) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
    student_limit INTEGER NOT NULL DEFAULT 100,
    enabled_modules JSONB NOT NULL DEFAULT '["students", "batches", "attendance", "fees", "reports", "staff"]'::jsonb,
    setup_fee_paid NUMERIC(10, 2) DEFAULT 0.00,
    recurring_amount NUMERIC(10, 2) DEFAULT 999.00,
    renewal_date DATE,
    licence_purchase_fee NUMERIC(10, 2) DEFAULT 0.00,
    licence_key VARCHAR(128),
    licence_start_date DATE,
    licence_expiry_date DATE,
    licensed_version VARCHAR(32) DEFAULT 'v1.0.0',
    hosting_responsibility VARCHAR(64) DEFAULT 'FIXIA Cloud (AWS Mumbai)',
    maintenance_responsibility VARCHAR(255) DEFAULT 'Annual Maintenance Contract (AMC) Required',
    upgrade_entitlement VARCHAR(255) DEFAULT 'Maintenance Updates & Minor Releases (v1.x)',
    support_entitlement VARCHAR(100) DEFAULT 'Standard Email & Priority WhatsApp Support',
    source_code_ownership BOOLEAN NOT NULL DEFAULT false CONSTRAINT chk_no_source_code_ownership CHECK (source_code_ownership = false),
    custom_requirements TEXT,
    quotation_reference VARCHAR(64),
    quotation_amount NUMERIC(10, 2) DEFAULT 0.00,
    defined_scope TEXT,
    milestone_status VARCHAR(32) DEFAULT 'in_development' CHECK (milestone_status IN ('discovery', 'in_development', 'testing', 'delivered', 'accepted')),
    delivery_date DATE,
    delivery_notes TEXT,
    support_agreement TEXT,
    custom_scope_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(institute_id)
);

-- ==============================================================================
-- Multi-Tenant Performance Indexes
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_memberships_institute ON public.memberships(institute_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON public.memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_batches_institute ON public.batches(institute_id);
CREATE INDEX IF NOT EXISTS idx_students_institute ON public.students(institute_id);
CREATE INDEX IF NOT EXISTS idx_students_batch ON public.students(batch_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON public.students(institute_id, status);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_batch_date ON public.attendance_sessions(institute_id, batch_id, session_date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_session ON public.attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_payments_institute_date ON public.payments(institute_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_student ON public.payments(student_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_institute ON public.audit_logs(institute_id, created_at DESC);


-- ==============================================================================
-- RLS Helper Functions
-- ==============================================================================

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

-- ==============================================================================
-- Enable Row Level Security (RLS) on all tables
-- ==============================================================================

ALTER TABLE public.institutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_subscriptions ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view profile" ON public.profiles FOR SELECT
    USING (id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.memberships m1
        JOIN public.memberships m2 ON m1.institute_id = m2.institute_id
        WHERE m1.user_id = auth.uid() AND m2.user_id = public.profiles.id
    ));

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT
    WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE
    USING (id = auth.uid());

-- Institutes Policies
CREATE POLICY "Members can view institute" ON public.institutes FOR SELECT
    USING (public.user_belongs_to_institute(id));

CREATE POLICY "Owners can update institute" ON public.institutes FOR UPDATE
    USING (public.get_user_role(id) = 'owner');

-- Memberships Policies
CREATE POLICY "Members can view memberships" ON public.memberships FOR SELECT
    USING (public.user_belongs_to_institute(institute_id));

CREATE POLICY "Owners and Admins can manage memberships" ON public.memberships FOR ALL
    USING (public.get_user_role(institute_id) IN ('owner', 'admin'))
    WITH CHECK (public.get_user_role(institute_id) IN ('owner', 'admin'));

-- Batches Policies
CREATE POLICY "Members view batches" ON public.batches FOR SELECT
    USING (public.user_belongs_to_institute(institute_id));

CREATE POLICY "Owners/Admins manage batches" ON public.batches FOR ALL
    USING (public.get_user_role(institute_id) IN ('owner', 'admin'))
    WITH CHECK (public.get_user_role(institute_id) IN ('owner', 'admin'));

-- Students Policies
CREATE POLICY "Members view students" ON public.students FOR SELECT
    USING (public.user_belongs_to_institute(institute_id));

CREATE POLICY "Owners/Admins manage students" ON public.students FOR ALL
    USING (public.get_user_role(institute_id) IN ('owner', 'admin'))
    WITH CHECK (public.get_user_role(institute_id) IN ('owner', 'admin'));

-- Attendance Policies
CREATE POLICY "Members view attendance sessions" ON public.attendance_sessions FOR SELECT
    USING (public.user_belongs_to_institute(institute_id));

CREATE POLICY "Staff manage attendance sessions" ON public.attendance_sessions FOR ALL
    USING (public.user_belongs_to_institute(institute_id))
    WITH CHECK (public.user_belongs_to_institute(institute_id));

CREATE POLICY "Members view attendance records" ON public.attendance_records FOR SELECT
    USING (public.user_belongs_to_institute(institute_id));

CREATE POLICY "Staff manage attendance records" ON public.attendance_records FOR ALL
    USING (public.user_belongs_to_institute(institute_id))
    WITH CHECK (public.user_belongs_to_institute(institute_id));

-- Fee Plans Policies
CREATE POLICY "Members view fee plans" ON public.fee_plans FOR SELECT
    USING (public.user_belongs_to_institute(institute_id));

CREATE POLICY "Owners/Admins manage fee plans" ON public.fee_plans FOR ALL
    USING (public.get_user_role(institute_id) IN ('owner', 'admin'))
    WITH CHECK (public.get_user_role(institute_id) IN ('owner', 'admin'));

-- Payments Policies (Staff excluded from viewing or creating payments)
CREATE POLICY "Owners/Admins view payments" ON public.payments FOR SELECT
    USING (public.get_user_role(institute_id) IN ('owner', 'admin'));

CREATE POLICY "Owners/Admins manage payments" ON public.payments FOR ALL
    USING (public.get_user_role(institute_id) IN ('owner', 'admin'))
    WITH CHECK (public.get_user_role(institute_id) IN ('owner', 'admin'));

-- Audit Logs Policies (Owners only)
CREATE POLICY "Owners view audit logs" ON public.audit_logs FOR SELECT
    USING (public.get_user_role(institute_id) = 'owner');

CREATE POLICY "Members insert audit logs" ON public.audit_logs FOR INSERT
    WITH CHECK (public.user_belongs_to_institute(institute_id));

-- Commercial Subscriptions Policies (Owners only)
CREATE POLICY "Owners view and manage subscription" ON public.commercial_subscriptions FOR ALL
    USING (public.get_user_role(institute_id) = 'owner')
    WITH CHECK (public.get_user_role(institute_id) = 'owner');

-- ==============================================================================
-- Auth Trigger & Stored Procedures
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, phone)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'phone'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Institute Onboarding Function (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.onboard_institute(
    p_name TEXT,
    p_slug TEXT,
    p_category TEXT,
    p_city TEXT,
    p_state TEXT,
    p_phone TEXT,
    p_director_name TEXT,
    p_email TEXT,
    p_tagline TEXT DEFAULT 'Leading Academic & Coaching Centre',
    p_address TEXT DEFAULT NULL,
    p_pincode TEXT DEFAULT '281001',
    p_reg_number TEXT DEFAULT NULL,
    p_receipt_prefix TEXT DEFAULT 'RCP-2026-',
    p_whatsapp_template TEXT DEFAULT 'Dear {guardian_name}, fee reminder from {institute_name}. {student_name} has pending tuition fee of ₹{balance_fee}. Kindly clear by 10th. Thank you.'
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_inst_id UUID;
    v_member_id UUID;
    v_unique_slug TEXT;
    v_slug_count INT;
    v_result JSONB;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required: User must be signed in to onboard an institute.';
    END IF;

    -- Upsert profile if missing
    INSERT INTO public.profiles (id, email, full_name, phone)
    VALUES (v_user_id, p_email, p_director_name, p_phone)
    ON CONFLICT (id) DO NOTHING;

    -- Ensure unique slug
    v_unique_slug := LOWER(REGEXP_REPLACE(p_slug, '[^a-zA-Z0-9\-]', '', 'g'));
    IF v_unique_slug = '' OR v_unique_slug IS NULL THEN
        v_unique_slug := 'inst-' || SUBSTRING(v_user_id::text, 1, 8);
    END IF;

    SELECT COUNT(*) INTO v_slug_count FROM public.institutes WHERE slug = v_unique_slug;
    IF v_slug_count > 0 THEN
        v_unique_slug := v_unique_slug || '-' || EXTRACT(EPOCH FROM NOW())::bigint;
    END IF;

    -- Insert Institute
    INSERT INTO public.institutes (
        slug, name, tagline, category, address, city, state, pincode,
        phone, email, director_name, reg_number, academic_session,
        currency_symbol, receipt_prefix, whatsapp_template
    ) VALUES (
        v_unique_slug, p_name, p_tagline, COALESCE(p_category, 'academic_k12'),
        p_address, p_city, p_state, p_pincode, p_phone, p_email,
        p_director_name, p_reg_number, '2026-2027', '₹', p_receipt_prefix, p_whatsapp_template
    )
    RETURNING id INTO v_inst_id;

    -- Insert Owner Membership
    INSERT INTO public.memberships (institute_id, user_id, role, role_title, is_active)
    VALUES (v_inst_id, v_user_id, 'owner', 'Institute Founder & Director', TRUE)
    RETURNING id INTO v_member_id;

    -- Insert Commercial Subscription
    INSERT INTO public.commercial_subscriptions (
        institute_id, model_type, plan_name, status, student_limit, enabled_modules, recurring_amount
    ) VALUES (
        v_inst_id, 'saas_subscription', 'Growth Plan (Active)', 'active', 100,
        '["students", "batches", "attendance", "fees", "reports", "staff"]'::jsonb, 999.00
    )
    ON CONFLICT (institute_id) DO NOTHING;

    -- Record Audit Log
    INSERT INTO public.audit_logs (institute_id, user_id, action, entity_type, entity_id, details)
    VALUES (
        v_inst_id, v_user_id, 'ONBOARD_INSTITUTE', 'institute', v_inst_id::text,
        jsonb_build_object('name', p_name, 'director_name', p_director_name, 'city', p_city)
    );

    SELECT jsonb_build_object(
        'institute_id', v_inst_id,
        'membership_id', v_member_id,
        'slug', v_unique_slug,
        'name', p_name,
        'role', 'owner'
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- Storage Buckets & Row Level Security Policies
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('receipts', 'receipts', false),
    ('documents', 'documents', false),
    ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_storage_institute_id(object_name TEXT)
RETURNS UUID AS $$
DECLARE
    v_folder TEXT;
BEGIN
    v_folder := (storage.foldername(object_name))[1];
    IF v_folder IS NULL OR v_folder = '' THEN
        RETURN NULL;
    END IF;
    RETURN v_folder::uuid;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DROP POLICY IF EXISTS "Tenant storage read policy" ON storage.objects;
CREATE POLICY "Tenant storage read policy"
    ON storage.objects FOR SELECT
    USING (
        bucket_id IN ('receipts', 'documents', 'avatars')
        AND (
            bucket_id = 'avatars'
            OR public.user_belongs_to_institute(public.get_storage_institute_id(name))
        )
    );

DROP POLICY IF EXISTS "Tenant storage insert policy" ON storage.objects;
CREATE POLICY "Tenant storage insert policy"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id IN ('receipts', 'documents', 'avatars')
        AND public.user_belongs_to_institute(public.get_storage_institute_id(name))
        AND (
            bucket_id = 'avatars'
            OR public.get_user_role(public.get_storage_institute_id(name)) IN ('owner', 'admin')
        )
    );

DROP POLICY IF EXISTS "Tenant storage delete policy" ON storage.objects;
CREATE POLICY "Tenant storage delete policy"
    ON storage.objects FOR DELETE
    USING (
        bucket_id IN ('receipts', 'documents', 'avatars')
        AND public.get_user_role(public.get_storage_institute_id(name)) = 'owner'
    );

-- Cross-Tenant Mutation Prevention Triggers
CREATE OR REPLACE FUNCTION public.prevent_cross_tenant_mutation()
RETURNS TRIGGER AS $$
DECLARE
    v_inst_id UUID;
BEGIN
    v_inst_id := OLD.institute_id;
    
    IF NOT public.user_belongs_to_institute(v_inst_id) THEN
        RAISE EXCEPTION 'Security Violation: Cross-tenant modification denied. Tenant % cannot modify records of %',
            auth.uid(), v_inst_id;
    END IF;

    IF NEW.institute_id != OLD.institute_id THEN
        RAISE EXCEPTION 'Security Violation: Cannot reassign institute_id of existing records.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_cross_tenant_students ON public.students;
CREATE TRIGGER trg_prevent_cross_tenant_students
    BEFORE UPDATE ON public.students
    FOR EACH ROW EXECUTE FUNCTION public.prevent_cross_tenant_mutation();

DROP TRIGGER IF EXISTS trg_prevent_cross_tenant_payments ON public.payments;
CREATE TRIGGER trg_prevent_cross_tenant_payments
    BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.prevent_cross_tenant_mutation();

DROP TRIGGER IF EXISTS trg_prevent_cross_tenant_batches ON public.batches;
CREATE TRIGGER trg_prevent_cross_tenant_batches
    BEFORE UPDATE ON public.batches
    FOR EACH ROW EXECUTE FUNCTION public.prevent_cross_tenant_mutation();

-- ==============================================================================
-- Commercial Quota Enforcement Triggers & Stored Procedures
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.check_commercial_student_quota()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_limit INTEGER;
    v_current_count INTEGER;
    v_status VARCHAR(32);
    v_lic_status VARCHAR(32);
    v_model VARCHAR(32);
BEGIN
    SELECT student_limit, subscription_status, licence_status, model_type
    INTO v_limit, v_status, v_lic_status, v_model
    FROM public.commercial_subscriptions
    WHERE institute_id = NEW.institute_id;

    IF v_limit IS NULL THEN
        v_limit := 100;
        v_status := 'active';
    END IF;

    IF v_model = 'saas_subscription' AND v_status NOT IN ('active', 'trial') THEN
        RAISE EXCEPTION 'Commercial admission blocked: SaaS subscription is % (renewal required)', v_status
            USING ERRCODE = 'P0001';
    END IF;

    IF v_model = 'one_time_licence' AND v_lic_status NOT IN ('active') THEN
        RAISE EXCEPTION 'Commercial admission blocked: One-time licence status is %', v_lic_status
            USING ERRCODE = 'P0001';
    END IF;

    SELECT COUNT(*) INTO v_current_count
    FROM public.students
    WHERE institute_id = NEW.institute_id AND status = 'active';

    IF v_current_count >= v_limit THEN
        RAISE EXCEPTION 'Commercial student quota exceeded: Current enrollment (%) has reached institute plan capacity of % students', v_current_count, v_limit
            USING ERRCODE = 'P0002';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_student_quota ON public.students;
CREATE TRIGGER trg_check_student_quota
    BEFORE INSERT ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION public.check_commercial_student_quota();

CREATE OR REPLACE FUNCTION public.check_module_entitlement(
    p_institute_id UUID,
    p_module_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_modules JSONB;
BEGIN
    SELECT enabled_modules INTO v_modules
    FROM public.commercial_subscriptions
    WHERE institute_id = p_institute_id;

    IF v_modules IS NULL THEN
        RETURN TRUE;
    END IF;

    RETURN (v_modules ? p_module_name);
END;
$$;

