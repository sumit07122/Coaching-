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


