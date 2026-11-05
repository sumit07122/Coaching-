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

