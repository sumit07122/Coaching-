-- =========================================================================
-- FIXIA CoachingOS — Complete Consolidated Supabase Database Setup
-- Project: Coaching- (xruokhpngwzlodpgmsui)
-- Generated on: 2026-11-10
-- =========================================================================

-- -------------------------------------------------------------------------
-- File: 20261103000001_core_schema.sql
-- -------------------------------------------------------------------------
-- ==============================================================================
-- FIXIA CoachingOS — Migration 001: Core Multi-Tenant Schema
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Institutes (Tenants)
CREATE TABLE IF NOT EXISTS institutes (
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

-- 2. User Profiles (Linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY, -- Matches auth.users.id
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Memberships (Linking Users to Institutes with Roles)
CREATE TABLE IF NOT EXISTS memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL CHECK (role IN ('owner', 'admin', 'staff')),
    role_title VARCHAR(100) NOT NULL,
    assigned_batches JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(institute_id, user_id)
);

-- 4. Batches
CREATE TABLE IF NOT EXISTS batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    course VARCHAR(255) NOT NULL,
    instructor_name VARCHAR(255),
    instructor_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
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
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    student_id VARCHAR(50) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    guardian_name VARCHAR(255) NOT NULL,
    guardian_phone VARCHAR(30),
    guardian_relation VARCHAR(32) DEFAULT 'Father',
    email VARCHAR(255),
    address TEXT,
    course VARCHAR(255) NOT NULL,
    batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
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
CREATE TABLE IF NOT EXISTS attendance_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    marked_by_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    total_enrolled INTEGER NOT NULL DEFAULT 0,
    total_present INTEGER NOT NULL DEFAULT 0,
    total_absent INTEGER NOT NULL DEFAULT 0,
    total_late INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(institute_id, batch_id, session_date)
);

CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL CHECK (status IN ('present', 'absent', 'late')),
    remarks TEXT,
    marked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, student_id)
);

-- 7. Fee Plans & Invoicing
CREATE TABLE IF NOT EXISTS fee_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    billing_frequency VARCHAR(32) NOT NULL CHECK (billing_frequency IN ('Monthly', 'Quarterly', 'Annual', 'Full Course', 'Custom')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Payments (With Full Reversal / Audit Capability)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    receipt_number VARCHAR(50) NOT NULL,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(32) NOT NULL CHECK (payment_method IN ('UPI', 'Cash', 'Bank Transfer', 'Cheque')),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    collected_by_name VARCHAR(255) NOT NULL,
    collected_by_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    remarks TEXT,
    invoiced_amount NUMERIC(10, 2) NOT NULL,
    paid_amount_prior NUMERIC(10, 2) NOT NULL,
    balance_remaining NUMERIC(10, 2) NOT NULL,
    status VARCHAR(32) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'reversed')),
    reversal_reason TEXT,
    reversed_at TIMESTAMPTZ,
    reversed_by_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(institute_id, receipt_number)
);

-- 9. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(100),
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Commercial Subscriptions & Licensing Entitlements
CREATE TABLE IF NOT EXISTS commercial_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
    model_type VARCHAR(32) NOT NULL CHECK (model_type IN ('saas_subscription', 'one_time_licence', 'custom_development')),
    plan_name VARCHAR(100) NOT NULL DEFAULT 'Growth Plan',
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'expired', 'trial')),
    student_limit INTEGER NOT NULL DEFAULT 100,
    enabled_modules JSONB NOT NULL DEFAULT '["students", "batches", "attendance", "fees", "reports", "staff"]'::jsonb,
    setup_fee_paid NUMERIC(10, 2) DEFAULT 0.00,
    recurring_amount NUMERIC(10, 2) DEFAULT 999.00,
    renewal_date DATE,
    licence_key VARCHAR(128),
    licensed_version VARCHAR(32),
    hosting_responsibility VARCHAR(64) DEFAULT 'FIXIA Cloud (AWS Mumbai)',
    support_entitlement VARCHAR(100) DEFAULT 'Standard Email & Priority WhatsApp Support',
    custom_scope_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(institute_id)
);

-- ==============================================================================
-- 11. Multi-Tenant Performance Indexes
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_memberships_institute ON memberships(institute_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_batches_institute ON batches(institute_id);
CREATE INDEX IF NOT EXISTS idx_students_institute ON students(institute_id);
CREATE INDEX IF NOT EXISTS idx_students_batch ON students(batch_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(institute_id, status);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_batch_date ON attendance_sessions(institute_id, batch_id, session_date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_session ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_payments_institute_date ON payments(institute_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_institute ON audit_logs(institute_id, created_at DESC);




-- -------------------------------------------------------------------------
-- File: 20261103000002_multi_tenant_rls.sql
-- -------------------------------------------------------------------------
-- ==============================================================================
-- FIXIA CoachingOS — Migration 002: Multi-Tenant Row Level Security (RLS)
-- ==============================================================================

-- 1. Helper function: Get calling user's active membership in an institute
CREATE OR REPLACE FUNCTION get_user_role(inst_id UUID)
RETURNS VARCHAR AS $$
BEGIN
    RETURN (
        SELECT role FROM memberships
        WHERE institute_id = inst_id
          AND user_id = auth.uid()
          AND is_active = TRUE
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Helper function: Check if user belongs to institute
CREATE OR REPLACE FUNCTION user_belongs_to_institute(inst_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM memberships
        WHERE institute_id = inst_id
          AND user_id = auth.uid()
          AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Enable RLS on all tables
ALTER TABLE institutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_subscriptions ENABLE ROW LEVEL SECURITY;

-- 4. Profiles RLS
CREATE POLICY "Users can view their own profile and peers in same institute"
    ON profiles FOR SELECT
    USING (
        id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM memberships m1
            JOIN memberships m2 ON m1.institute_id = m2.institute_id
            WHERE m1.user_id = auth.uid() AND m2.user_id = profiles.id
        )
    );

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (id = auth.uid());

-- 5. Institutes RLS
CREATE POLICY "Members can view their institute"
    ON institutes FOR SELECT
    USING (user_belongs_to_institute(id));

CREATE POLICY "Owners can update their institute"
    ON institutes FOR UPDATE
    USING (get_user_role(id) = 'owner');

-- 6. Memberships RLS
CREATE POLICY "Members can view members in their institute"
    ON memberships FOR SELECT
    USING (user_belongs_to_institute(institute_id));

CREATE POLICY "Owners and Admins can insert/update staff memberships"
    ON memberships FOR INSERT
    WITH CHECK (get_user_role(institute_id) IN ('owner', 'admin'));

CREATE POLICY "Owners can update any membership; Admins cannot demote Owners"
    ON memberships FOR UPDATE
    USING (
        get_user_role(institute_id) = 'owner'
        OR (get_user_role(institute_id) = 'admin' AND role != 'owner')
    );

CREATE POLICY "Only Owners can delete memberships"
    ON memberships FOR DELETE
    USING (get_user_role(institute_id) = 'owner');

-- 7. Batches RLS
CREATE POLICY "Institute members can view batches"
    ON batches FOR SELECT
    USING (user_belongs_to_institute(institute_id));

CREATE POLICY "Owners and Admins can manage batches"
    ON batches FOR ALL
    USING (get_user_role(institute_id) IN ('owner', 'admin'))
    WITH CHECK (get_user_role(institute_id) IN ('owner', 'admin'));

-- 8. Students RLS
CREATE POLICY "Institute members can view students"
    ON students FOR SELECT
    USING (user_belongs_to_institute(institute_id));

CREATE POLICY "Owners and Admins can manage students"
    ON students FOR ALL
    USING (get_user_role(institute_id) IN ('owner', 'admin'))
    WITH CHECK (get_user_role(institute_id) IN ('owner', 'admin'));

-- 9. Attendance RLS
CREATE POLICY "Institute members can view attendance sessions"
    ON attendance_sessions FOR SELECT
    USING (user_belongs_to_institute(institute_id));

CREATE POLICY "Authorized staff can insert/update attendance sessions"
    ON attendance_sessions FOR ALL
    USING (user_belongs_to_institute(institute_id))
    WITH CHECK (user_belongs_to_institute(institute_id));

CREATE POLICY "Institute members can view attendance records"
    ON attendance_records FOR SELECT
    USING (user_belongs_to_institute(institute_id));

CREATE POLICY "Authorized staff can mark attendance records"
    ON attendance_records FOR ALL
    USING (user_belongs_to_institute(institute_id))
    WITH CHECK (user_belongs_to_institute(institute_id));

-- 10. Fee Plans RLS
CREATE POLICY "Members can view fee plans"
    ON fee_plans FOR SELECT
    USING (user_belongs_to_institute(institute_id));

CREATE POLICY "Owners and Admins can manage fee plans"
    ON fee_plans FOR ALL
    USING (get_user_role(institute_id) IN ('owner', 'admin'))
    WITH CHECK (get_user_role(institute_id) IN ('owner', 'admin'));

-- 11. Payments RLS (Staff cannot view or manipulate financial records)
CREATE POLICY "Owners and Admins can view payments"
    ON payments FOR SELECT
    USING (get_user_role(institute_id) IN ('owner', 'admin'));

CREATE POLICY "Owners and Admins can record payments"
    ON payments FOR INSERT
    WITH CHECK (get_user_role(institute_id) IN ('owner', 'admin'));

CREATE POLICY "Only Owners and Admins can reverse payments"
    ON payments FOR UPDATE
    USING (get_user_role(institute_id) IN ('owner', 'admin'));

-- 12. Audit Logs RLS (Only Owners can view full audit trail)
CREATE POLICY "Owners can view audit logs"
    ON audit_logs FOR SELECT
    USING (get_user_role(institute_id) = 'owner');

CREATE POLICY "System can insert audit logs"
    ON audit_logs FOR INSERT
    WITH CHECK (user_belongs_to_institute(institute_id));

-- 13. Commercial Subscriptions RLS (Owners only)
CREATE POLICY "Owners can view commercial subscription"
    ON commercial_subscriptions FOR SELECT
    USING (get_user_role(institute_id) = 'owner');

CREATE POLICY "Owners can update commercial subscription"
    ON commercial_subscriptions FOR ALL
    USING (get_user_role(institute_id) = 'owner')
    WITH CHECK (get_user_role(institute_id) = 'owner');



-- -------------------------------------------------------------------------
-- File: 20261103000003_auth_onboarding_and_security.sql
-- -------------------------------------------------------------------------
-- ==============================================================================
-- FIXIA CoachingOS — Migration 003: Auth Onboarding, Profiles Sync & Role Functions
-- ==============================================================================

-- 1. Automatic Profile Creation on Supabase Auth Sign-Up
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

-- Trigger linked to Supabase auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Allow authenticated users to manage their own profile row
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can insert their own profile'
    ) THEN
        CREATE POLICY "Users can insert their own profile"
            ON public.profiles FOR INSERT
            WITH CHECK (id = auth.uid());
    END IF;
END $$;

-- 3. Stored Procedure: Onboard New Institute (Transactional Bootstrapping)
-- Solves the chicken-and-egg RLS bootstrapping problem cleanly with SECURITY DEFINER
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
    v_user_email TEXT;
    v_user_name TEXT;
    v_inst_id UUID;
    v_member_id UUID;
    v_unique_slug TEXT;
    v_slug_count INT;
    v_result JSONB;
BEGIN
    -- Verify authenticated user
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required: User must be signed in to onboard an institute.';
    END IF;

    -- Fetch user profile info
    SELECT email, full_name INTO v_user_email, v_user_name
    FROM public.profiles
    WHERE id = v_user_id;

    -- Ensure profile exists
    IF v_user_email IS NULL THEN
        INSERT INTO public.profiles (id, email, full_name, phone)
        VALUES (v_user_id, p_email, p_director_name, p_phone)
        ON CONFLICT (id) DO NOTHING;
    END IF;

    -- Ensure unique slug
    v_unique_slug := LOWER(REGEXP_REPLACE(p_slug, '[^a-zA-Z0-9\-]', '', 'g'));
    IF v_unique_slug = '' OR v_unique_slug IS NULL THEN
        v_unique_slug := 'inst-' || SUBSTRING(v_user_id::text, 1, 8);
    END IF;

    SELECT COUNT(*) INTO v_slug_count FROM public.institutes WHERE slug = v_unique_slug;
    IF v_slug_count > 0 THEN
        v_unique_slug := v_unique_slug || '-' || EXTRACT(EPOCH FROM NOW())::bigint;
    END IF;

    -- 1. Insert Institute
    INSERT INTO public.institutes (
        slug,
        name,
        tagline,
        category,
        address,
        city,
        state,
        pincode,
        phone,
        email,
        director_name,
        reg_number,
        academic_session,
        currency_symbol,
        receipt_prefix,
        whatsapp_template
    ) VALUES (
        v_unique_slug,
        p_name,
        p_tagline,
        COALESCE(p_category, 'academic_k12'),
        p_address,
        p_city,
        p_state,
        p_pincode,
        p_phone,
        p_email,
        p_director_name,
        p_reg_number,
        '2026-2027',
        '₹',
        p_receipt_prefix,
        p_whatsapp_template
    )
    RETURNING id INTO v_inst_id;

    -- 2. Insert Owner Membership
    INSERT INTO public.memberships (
        institute_id,
        user_id,
        role,
        role_title,
        is_active
    ) VALUES (
        v_inst_id,
        v_user_id,
        'owner',
        'Institute Founder & Director',
        TRUE
    )
    RETURNING id INTO v_member_id;

    -- 3. Insert Commercial Subscription (Growth Plan, 100 students max)
    INSERT INTO public.commercial_subscriptions (
        institute_id,
        model_type,
        plan_name,
        status,
        student_limit,
        enabled_modules,
        recurring_amount
    ) VALUES (
        v_inst_id,
        'saas_subscription',
        'Growth Plan (Active)',
        'active',
        100,
        '["students", "batches", "attendance", "fees", "reports", "staff"]'::jsonb,
        999.00
    )
    ON CONFLICT (institute_id) DO NOTHING;

    -- 4. Record Audit Log
    INSERT INTO public.audit_logs (
        institute_id,
        user_id,
        action,
        entity_type,
        entity_id,
        details
    ) VALUES (
        v_inst_id,
        v_user_id,
        'ONBOARD_INSTITUTE',
        'institute',
        v_inst_id::text,
        jsonb_build_object(
            'institute_name', p_name,
            'director_name', p_director_name,
            'city', p_city,
            'category', p_category,
            'slug', v_unique_slug
        )
    );

    -- Build return payload
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

-- 4. Stored Procedure: Update Institute Profile Settings (Owner Only)
CREATE OR REPLACE FUNCTION public.update_institute_profile(
    p_institute_id UUID,
    p_name TEXT,
    p_tagline TEXT,
    p_category TEXT,
    p_address TEXT,
    p_city TEXT,
    p_state TEXT,
    p_pincode TEXT,
    p_phone TEXT,
    p_email TEXT,
    p_director_name TEXT,
    p_reg_number TEXT,
    p_academic_session TEXT,
    p_receipt_prefix TEXT,
    p_whatsapp_template TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_role VARCHAR;
BEGIN
    -- Check role authorization
    SELECT role INTO v_user_role
    FROM public.memberships
    WHERE institute_id = p_institute_id
      AND user_id = auth.uid()
      AND is_active = TRUE;

    IF v_user_role IS NULL OR v_user_role != 'owner' THEN
        RAISE EXCEPTION 'Access Denied: Only institute owners can update institute profile settings.';
    END IF;

    UPDATE public.institutes SET
        name = COALESCE(p_name, name),
        tagline = COALESCE(p_tagline, tagline),
        category = COALESCE(p_category, category),
        address = COALESCE(p_address, address),
        city = COALESCE(p_city, city),
        state = COALESCE(p_state, state),
        pincode = COALESCE(p_pincode, pincode),
        phone = COALESCE(p_phone, phone),
        email = COALESCE(p_email, email),
        director_name = COALESCE(p_director_name, director_name),
        reg_number = COALESCE(p_reg_number, reg_number),
        academic_session = COALESCE(p_academic_session, academic_session),
        receipt_prefix = COALESCE(p_receipt_prefix, receipt_prefix),
        whatsapp_template = COALESCE(p_whatsapp_template, whatsapp_template),
        updated_at = NOW()
    WHERE id = p_institute_id;

    -- Audit log
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
        'UPDATE_INSTITUTE_SETTINGS',
        'institute',
        p_institute_id::text,
        jsonb_build_object('name', p_name, 'updated_by', auth.uid())
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Stored Procedure: Fetch Calling User's Current Profile & Memberships Context
CREATE OR REPLACE FUNCTION public.get_current_user_context()
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_profile JSONB;
    v_memberships JSONB;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('authenticated', false);
    END IF;

    -- Fetch profile
    SELECT to_jsonb(p) INTO v_profile
    FROM public.profiles p
    WHERE p.id = v_user_id;

    -- Fetch active memberships with institute details
    SELECT jsonb_agg(
        jsonb_build_object(
            'membership_id', m.id,
            'role', m.role,
            'role_title', m.role_title,
            'assigned_batches', m.assigned_batches,
            'institute', to_jsonb(i)
        )
    ) INTO v_memberships
    FROM public.memberships m
    JOIN public.institutes i ON m.institute_id = i.id
    WHERE m.user_id = v_user_id AND m.is_active = TRUE;

    RETURN jsonb_build_object(
        'authenticated', true,
        'profile', COALESCE(v_profile, '{}'::jsonb),
        'memberships', COALESCE(v_memberships, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;



-- -------------------------------------------------------------------------
-- File: 20261103000004_storage_and_security_hardening.sql
-- -------------------------------------------------------------------------
-- ==============================================================================
-- FIXIA CoachingOS — Migration 004: Storage RLS & Cross-Tenant Security Hardening
-- ==============================================================================

-- 1. Create Storage Buckets for Multi-Tenant Files
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('receipts', 'receipts', false),
    ('documents', 'documents', false),
    ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Objects Row Level Security Policies
-- Folder naming convention: <institute_id>/<subfolder>/<filename>
-- e.g. 'c7a52310-91a4-4f51-b852-c8004f7f6201/receipts/RCP-2026-081.pdf'

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

-- Storage Read Policy: User can only read files belonging to their active institute
DROP POLICY IF EXISTS "Tenant storage read policy" ON storage.objects;
CREATE POLICY "Tenant storage read policy"
    ON storage.objects FOR SELECT
    USING (
        bucket_id IN ('receipts', 'documents', 'avatars')
        AND (
            -- Avatars may be read publicly
            bucket_id = 'avatars'
            -- Otherwise, caller must belong to the institute encoded in the root folder path
            OR public.user_belongs_to_institute(public.get_storage_institute_id(name))
        )
    );

-- Storage Upload Policy: User can only upload into their own institute's root folder
DROP POLICY IF EXISTS "Tenant storage insert policy" ON storage.objects;
CREATE POLICY "Tenant storage insert policy"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id IN ('receipts', 'documents', 'avatars')
        AND public.user_belongs_to_institute(public.get_storage_institute_id(name))
        AND (
            -- Receipts & sensitive documents require owner or admin role
            bucket_id = 'avatars'
            OR public.get_user_role(public.get_storage_institute_id(name)) IN ('owner', 'admin')
        )
    );

-- Storage Delete Policy: Only institute owner can delete storage vouchers
DROP POLICY IF EXISTS "Tenant storage delete policy" ON storage.objects;
CREATE POLICY "Tenant storage delete policy"
    ON storage.objects FOR DELETE
    USING (
        bucket_id IN ('receipts', 'documents', 'avatars')
        AND public.get_user_role(public.get_storage_institute_id(name)) = 'owner'
    );

-- 3. Database Server-Level Cross-Tenant Mutation Guard Trigger
CREATE OR REPLACE FUNCTION public.prevent_cross_tenant_mutation()
RETURNS TRIGGER AS $$
DECLARE
    v_inst_id UUID;
    v_caller_role VARCHAR;
BEGIN
    v_inst_id := OLD.institute_id;
    
    -- Verify caller belongs to the target institute
    IF NOT public.user_belongs_to_institute(v_inst_id) THEN
        RAISE EXCEPTION 'Security Violation: Cross-tenant modification denied. Tenant % cannot modify records of %',
            auth.uid(), v_inst_id;
    END IF;

    -- Verify institute_id cannot be changed (tenant tampering prevention)
    IF NEW.institute_id != OLD.institute_id THEN
        RAISE EXCEPTION 'Security Violation: Cannot reassign institute_id of existing records.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply cross-tenant immutability triggers
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



-- -------------------------------------------------------------------------
-- File: 20261103000005_commercial_configuration.sql
-- -------------------------------------------------------------------------
-- ==============================================================================
-- Migration: 20261103000005_commercial_configuration.sql
-- Description: Commercial Customer Configuration supporting Three Business Models:
--              Model A (SaaS Subscription)
--              Model B (One-Time Software Licence)
--              Model C (Custom Development)
--              Strict separation of purchase model, subscription status, licence
--              status, feature entitlements, student limits, hosting, and support.
-- ==============================================================================

-- 1. Add discrete commercial configuration columns
ALTER TABLE public.commercial_subscriptions
    ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(32) DEFAULT 'active'
        CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'trial', 'expired', 'not_applicable')),
    ADD COLUMN IF NOT EXISTS licence_status VARCHAR(32) DEFAULT 'not_applicable'
        CHECK (licence_status IN ('active', 'expired', 'suspended', 'pending_activation', 'not_applicable')),
    ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(16) DEFAULT 'monthly'
        CHECK (billing_cycle IN ('monthly', 'annual')),
    ADD COLUMN IF NOT EXISTS licence_purchase_fee NUMERIC(10, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS licence_start_date DATE,
    ADD COLUMN IF NOT EXISTS licence_expiry_date DATE,
    ADD COLUMN IF NOT EXISTS maintenance_responsibility VARCHAR(255),
    ADD COLUMN IF NOT EXISTS upgrade_entitlement VARCHAR(255),
    ADD COLUMN IF NOT EXISTS source_code_ownership BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS custom_requirements TEXT,
    ADD COLUMN IF NOT EXISTS quotation_reference VARCHAR(64),
    ADD COLUMN IF NOT EXISTS quotation_amount NUMERIC(10, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS defined_scope TEXT,
    ADD COLUMN IF NOT EXISTS milestone_status VARCHAR(32) DEFAULT 'in_development'
        CHECK (milestone_status IN ('discovery', 'in_development', 'testing', 'delivered', 'accepted')),
    ADD COLUMN IF NOT EXISTS delivery_date DATE,
    ADD COLUMN IF NOT EXISTS delivery_notes TEXT,
    ADD COLUMN IF NOT EXISTS support_agreement TEXT;

-- 2. Server/Database-level validation: enforce non-ownership of source code on one-time licenses
ALTER TABLE public.commercial_subscriptions
    DROP CONSTRAINT IF EXISTS chk_no_source_code_ownership;

ALTER TABLE public.commercial_subscriptions
    ADD CONSTRAINT chk_no_source_code_ownership
    CHECK (source_code_ownership = false);

-- 3. Database Function to check student capacity before admission
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
    -- Retrieve commercial parameters
    SELECT student_limit, subscription_status, licence_status, model_type
    INTO v_limit, v_status, v_lic_status, v_model
    FROM public.commercial_subscriptions
    WHERE institute_id = NEW.institute_id;

    -- If no commercial record exists, default to 100
    IF v_limit IS NULL THEN
        v_limit := 100;
        v_status := 'active';
    END IF;

    -- Verify active subscription or active licence status
    IF v_model = 'saas_subscription' AND v_status NOT IN ('active', 'trial') THEN
        RAISE EXCEPTION 'Commercial admission blocked: SaaS subscription is % (renewal required)', v_status
            USING ERRCODE = 'P0001';
    END IF;

    IF v_model = 'one_time_licence' AND v_lic_status NOT IN ('active') THEN
        RAISE EXCEPTION 'Commercial admission blocked: One-time licence status is %', v_lic_status
            USING ERRCODE = 'P0001';
    END IF;

    -- Count active students
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

-- 4. Trigger to validate student quota on insertion
DROP TRIGGER IF EXISTS trg_check_student_quota ON public.students;
CREATE TRIGGER trg_check_student_quota
    BEFORE INSERT ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION public.check_commercial_student_quota();

-- 5. Helper function to validate module entitlement on server side
CREATE OR REPLACE FUNCTION public.check_module_entitlement(
    p_institute_id UUID,
    p_module_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_modules JSONB;
BEGIN
    SELECT enabled_modules INTO v_modules
    FROM public.commercial_subscriptions
    WHERE institute_id = p_institute_id;

    IF v_modules IS NULL THEN
        RETURN true;
    END IF;

    RETURN v_modules ? p_module_name;
END;
$$;



-- -------------------------------------------------------------------------
-- File: 20261103000006_teacher_rls_and_platform_admin.sql
-- -------------------------------------------------------------------------
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



-- -------------------------------------------------------------------------
-- File: 20261103000007_expenses_schedules_transfers.sql
-- -------------------------------------------------------------------------
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



