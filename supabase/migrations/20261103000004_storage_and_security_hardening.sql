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

