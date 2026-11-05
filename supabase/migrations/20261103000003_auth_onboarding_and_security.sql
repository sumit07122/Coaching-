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

