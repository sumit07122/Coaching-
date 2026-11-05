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

