# FIXIA EduOS — Relational Database Schema & Domain Blueprint

**Document Version:** 1.0.0  
**Status:** Approved Architectural Blueprint  
**Engine:** PostgreSQL 15+ (Supabase Managed Cloud)  
**Currency Standard:** Integer Paise (e.g. ₹1,499 = 149,900 paise)  
**Primary Keys:** UUID (`gen_random_uuid()`)  
**Author:** Principal Database Architect & Security Engineer  

---

## 1. Schema Principles & Shared Column Standards

Every tenant-scoped table in FIXIA EduOS follows strict schema conventions to enforce data integrity, multi-tenant isolation, and auditable history:

```sql
-- Standard Tenant-Owned Table Template
CREATE TABLE public.example_entity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL, -- Where branch-scoping applies
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
```

### Critical Rules:
1. **Integer Paise for Money:** Floating-point types (`float`, `real`, `numeric` without bounds) are strictly forbidden for currency transactions. All amounts are stored as integer paise (`BIGINT` or `INTEGER`).
2. **Explicit Timestamps:** Timestamps always use `TIMESTAMPTZ` (UTC with timezone). Academic dates without time use `DATE`.
3. **No Catch-All JSONB:** JSONB is reserved for dynamic custom attributes, UI preferences, or webhook payloads. Core relational data (students, fees, attendance, batches) is strictly modeled in relational columns.
4. **Soft Deletions:** Critical entities (students, batches, staff) use `status = 'archived'` or `deleted_at TIMESTAMPTZ` so historical records and prior session data remain intact.

---

## 2. Six Logical Database Areas

```
+---------------------------------------------------------------------------------------------------+
|                                 FIXIA EduOS DATABASE DOMAIN MODEL                                 |
+---------------------------------------------------------------------------------------------------+
  1. Platform & Tenants        2. Subscriptions & Plans     3. Academic Operations
  - profiles                   - plans                      - academic_sessions
  - platform_admins            - plan_versions              - courses
  - tenants                    - features                   - subjects
  - tenant_memberships         - plan_features              - course_subjects
  - branches                   - tenant_subscriptions       - batches
  - branch_memberships         - tenant_entitlements        - batch_schedules
  - invitations                - subscription_events        - batch_enrollments
  - audit_logs                 - platform_payments          - teacher_assignments
-----------------------------------------------------------------------------------------------------
  4. Admissions & Students     5. Attendance & Finances     6. Exams, Staff & Website
  - leads                      - attendance_sessions        - examinations
  - lead_followups             - attendance_records         - exam_subjects
  - students                   - fee_structures             - exam_enrollments
  - guardians                  - student_fee_accounts       - exam_results
  - student_guardians          - fee_installments           - staff_profiles
  - student_documents          - payments                   - notices & notifications
  - student_status_history     - receipts & refunds         - website_pages & enquiries
+---------------------------------------------------------------------------------------------------+
```

---

## 3. Detailed Table Specifications by Area

### Area 1: Platform & Tenant Governance
- `profiles`: Extends `auth.users`. Contains `id` (references `auth.users(id)`), `full_name`, `phone`, `avatar_url`, timestamps.
- `platform_admins`: Super Admins and Platform Support personnel. Fields: `user_id` (PK, references profiles), `email`, `role` (`super_admin`, `platform_admin`, `billing_admin`, `support_agent`), `is_active`.
- `tenants`: Coaching institute entities. Fields: `id` (UUID), `name`, `slug` (unique across platform), `institute_type` (`coaching_k12`, `jee_neet`, `commerce_ca`, `computer_it`, `skills_languages`), `city`, `state`, `status` (`active`, `trial`, `suspended`, `expired`).
- `tenant_memberships`: Maps users to institutes. Fields: `id`, `tenant_id`, `user_id`, `role` (`owner`, `admin`, `branch_manager`, `accountant`, `receptionist`, `teacher`, `student`, `parent`), `is_active`, unique constraint on `(tenant_id, user_id)`.
- `branches`: Physical coaching branches/centers. Fields: `id`, `tenant_id`, `name`, `code`, `address`, `phone`, `status`.
- `branch_memberships`: Maps staff members to specific branches. Fields: `id`, `branch_id`, `user_id`.
- `invitations`: Secure email invitations. Fields: `id`, `tenant_id`, `email`, `role`, `token_hash`, `expires_at`, `status`.
- `audit_logs`: Immutable audit log. Fields: `id`, `tenant_id`, `actor_id`, `actor_email`, `action`, `entity_type`, `entity_id`, `details` (JSONB), `reason`, `created_at`.

### Area 2: Subscriptions & Feature Entitlements
- `plans`: SaaS subscription templates (`Starter`, `Growth`, `Pro`, `Enterprise`). Fields: `id`, `name`, `slug`, `model_type` (`saas_subscription`, `one_time_licence`, `custom_development`), `base_price_paise`, `billing_cycle`.
- `features`: Catalog of product features. Fields: `id`, `key` (`students`, `branches`, `admissions`, `attendance`, `fees`, `examinations`, `public_website`, `whatsapp_automation`), `name`, `description`.
- `plan_features`: Features included in each plan with default limits. Fields: `id`, `plan_id`, `feature_id`, `default_limit`.
- `tenant_subscriptions`: Active subscription record per institute. Fields: `id`, `tenant_id`, `plan_id`, `status` (`trialing`, `active`, `past_due`, `grace_period`, `suspended`, `cancelled`, `expired`), `student_limit`, `branch_limit`, `current_period_start`, `current_period_end`.
- `tenant_entitlements`: Actual effective feature limits per tenant (allows custom overrides). Fields: `id`, `tenant_id`, `feature_key`, `is_enabled`, `quantity_limit`, `custom_override`.
- `platform_payments`: Commercial payments made by institutes to FIXIA. Fields: `id`, `tenant_id`, `amount_paise`, `gateway` (Razorpay/Stripe/Manual), `transaction_ref`, `status`.

### Area 3: Academic Operations
- `academic_sessions`: Academic years (e.g. `2026-2027`). Fields: `id`, `tenant_id`, `name`, `start_date`, `end_date`, `is_current`.
- `courses`: Educational offerings. Fields: `id`, `tenant_id`, `name`, `category`, `duration_months`, `default_fee_paise`, `status`.
- `subjects`: Academic subjects. Fields: `id`, `tenant_id`, `name`, `code`.
- `course_subjects`: Mapping of subjects to courses. Fields: `course_id`, `subject_id`.
- `batches`: Cohorts of students. Fields: `id`, `tenant_id`, `branch_id`, `course_id`, `name`, `code`, `capacity`, `schedule_days`, `start_time`, `end_time`, `room_number`, `status`.
- `batch_schedules`: Weekly timetable slots. Fields: `id`, `tenant_id`, `batch_id`, `day_of_week` (0-6), `start_time`, `end_time`, `room_number`, `instructor_user_id`.
- `batch_enrollments`: Student allocations to batches. Fields: `id`, `tenant_id`, `student_id`, `batch_id`, `enrollment_date`, `status` (`active`, `transferred`, `completed`), unique on `(tenant_id, student_id, batch_id)` when status is active.
- `teacher_assignments`: Instructor to batch mapping. Fields: `id`, `tenant_id`, `batch_id`, `teacher_user_id`, `subject_id`, `is_primary`.

### Area 4: Admissions & Student Management
- `leads`: Prospective student enquiries. Fields: `id`, `tenant_id`, `branch_id`, `full_name`, `phone`, `email`, `interested_course_id`, `source`, `counselor_user_id`, `status` (`new`, `contacted`, `interested`, `converted`, `lost`).
- `lead_followups`: Follow-up logs. Fields: `id`, `tenant_id`, `lead_id`, `notes`, `next_followup_date`, `recorded_by`.
- `students`: Admitted students. Fields: `id`, `tenant_id`, `branch_id`, `student_id_number` (e.g. `FIX-2026-001`), `full_name`, `dob`, `gender`, `phone`, `email`, `address`, `admission_date`, `avatar_url`, `status` (`active`, `archived`, `graduated`).
- `guardians`: Parent/guardian records. Fields: `id`, `tenant_id`, `full_name`, `phone`, `email`, `occupation`.
- `student_guardians`: Relationship link. Fields: `student_id`, `guardian_id`, `relationship` (`father`, `mother`, `guardian`), `is_primary`.
- `student_documents`: Document metadata. Fields: `id`, `tenant_id`, `student_id`, `document_type`, `file_path`, `verified`.
- `student_status_history`: History of batch transfers and status changes. Fields: `id`, `tenant_id`, `student_id`, `from_batch_id`, `to_batch_id`, `reason`, `transferred_by`.

### Area 5: Attendance & Finances
- `attendance_sessions`: Roll-call session per batch/date. Fields: `id`, `tenant_id`, `batch_id`, `session_date`, `taken_by_user_id`, `status` (`finalized`, `draft`), unique on `(tenant_id, batch_id, session_date)`.
- `attendance_records`: Individual student statuses. Fields: `id`, `session_id`, `student_id`, `status` (`present`, `absent`, `late`, `leave`), `remarks`.
- `fee_structures`: Base fee templates. Fields: `id`, `tenant_id`, `course_id`, `name`, `amount_paise`, `billing_frequency`.
- `student_fee_accounts`: Overall financial obligation per student. Fields: `id`, `tenant_id`, `student_id`, `total_invoiced_paise`, `total_paid_paise`, `balance_paise`.
- `fee_installments`: Due dates and breakdown. Fields: `id`, `account_id`, `due_date`, `amount_paise`, `status` (`unpaid`, `partial`, `paid`).
- `payments`: Recorded payment transactions. Fields: `id`, `tenant_id`, `student_id`, `receipt_number`, `amount_paise`, `payment_method` (`upi`, `cash`, `bank_transfer`, `cheque`, `card`), `reference_number`, `payment_date`, `status` (`completed`, `reversed`), `reversed_by`, `reversal_reason`.
- `receipts`: Metadata for official printable receipts. Fields: `id`, `tenant_id`, `payment_id`, `receipt_number`, `pdf_url`, `generated_at`.
- `expenses`: Institute operational outflow vouchers. Fields: `id`, `tenant_id`, `branch_id`, `category` (`rent`, `salaries`, `utilities`, `stationery`, `marketing`, `maintenance`, `software`, `other`), `amount_paise`, `expense_date`, `title`, `recipient`, `payment_mode`, `reference_number`, `is_voided`, `void_reason`.

### Area 6: Examinations, Staff & Communication
- `examinations`: Scheduled tests. Fields: `id`, `tenant_id`, `title`, `academic_session_id`, `exam_date`, `is_published`.
- `exam_subjects`: Subjects in an exam. Fields: `id`, `exam_id`, `subject_id`, `max_marks`, `passing_marks`.
- `exam_results`: Marks awarded. Fields: `id`, `exam_subject_id`, `student_id`, `marks_obtained`, `grade`, check `marks_obtained <= max_marks`.
- `staff_profiles`: Faculty and administrative employee details. Fields: `id`, `tenant_id`, `user_id`, `employee_code`, `specialization`, `joining_date`, `salary_paise`.
- `notices`: Institute-wide announcements. Fields: `id`, `tenant_id`, `title`, `content`, `target_audience`, `publish_date`.
- `website_settings`: Public website configuration. Fields: `tenant_id` (PK), `subdomain_slug`, `custom_domain`, `is_published`, `theme_color`, `about_text`, `contact_phone`, `contact_whatsapp`.
- `website_pages`: Static CMS content for public site. Fields: `id`, `tenant_id`, `slug`, `title`, `content_json`, `is_published`.
- `website_enquiries`: Public leads generated from the website form. Fields: `id`, `tenant_id`, `visitor_name`, `phone`, `message`, `source_url`.

---

## 4. Essential Database Integrity Constraints

```sql
-- 1. Globally unique institute subdomain slug
ALTER TABLE public.tenants ADD CONSTRAINT uq_tenants_slug UNIQUE (slug);

-- 2. Tenant isolation on memberships
ALTER TABLE public.tenant_memberships ADD CONSTRAINT uq_tenant_user UNIQUE (tenant_id, user_id);

-- 3. Composite uniqueness for relational consistency
ALTER TABLE public.batches ADD CONSTRAINT uq_batches_tenant_id UNIQUE (tenant_id, id);
ALTER TABLE public.students ADD CONSTRAINT uq_students_tenant_id UNIQUE (tenant_id, id);

-- 4. Duplicate attendance prevention
ALTER TABLE public.attendance_sessions ADD CONSTRAINT uq_attendance_session UNIQUE (tenant_id, batch_id, session_date);
ALTER TABLE public.attendance_records ADD CONSTRAINT uq_attendance_record UNIQUE (session_id, student_id);

-- 5. Mark validation constraint
ALTER TABLE public.exam_results ADD CONSTRAINT chk_marks_within_limit CHECK (marks_obtained >= 0);

-- 6. Legal constraint: Software licenses do not convey source code ownership
ALTER TABLE public.tenant_subscriptions ADD CONSTRAINT chk_no_source_code_ownership CHECK (source_code_ownership = false);
```

### Student Quota Barrier Trigger
```sql
CREATE OR REPLACE FUNCTION public.check_commercial_student_quota()
RETURNS TRIGGER AS $$
DECLARE
    v_limit INTEGER;
    v_current_count INTEGER;
    v_status VARCHAR(32);
BEGIN
    SELECT student_limit, status INTO v_limit, v_status
    FROM public.tenant_subscriptions
    WHERE tenant_id = NEW.tenant_id;

    IF v_limit IS NULL THEN v_limit := 100; END IF;

    IF v_status NOT IN ('active', 'trialing', 'grace_period') THEN
        RAISE EXCEPTION 'Commercial admission blocked: Subscription is % (renewal required)', v_status
            USING ERRCODE = 'P0001';
    END IF;

    SELECT COUNT(*) INTO v_current_count
    FROM public.students
    WHERE tenant_id = NEW.tenant_id AND status = 'active';

    IF v_current_count >= v_limit THEN
        RAISE EXCEPTION 'Commercial student quota exceeded: Active count (%) reached plan capacity of % students', v_current_count, v_limit
            USING ERRCODE = 'P0002';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_check_student_quota
    BEFORE INSERT ON public.students
    FOR EACH ROW EXECUTE FUNCTION public.check_commercial_student_quota();
```
