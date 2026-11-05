# FIXIA CoachingOS — Production Supabase Backend Setup & Security Guide

This document details the configuration, migration execution, and verification of the production Supabase backend for **FIXIA CoachingOS**.

---

## 1. Supabase Project Setup

1. **Create Project**:
   - Navigate to [Supabase Console](https://supabase.com/dashboard).
   - Click **New Project**.
   - Select your deployment region (recommend `ap-south-1` Mumbai for Indian institutes).
   - Set a strong database password and store it securely.

2. **Retrieve API Credentials**:
   - Go to **Project Settings > API**.
   - Copy **Project URL** (`https://<project-id>.supabase.co`).
   - Copy **Project API keys > `anon` / `public`**.
   - **DO NOT COPY OR USE the `service_role` key in frontend code.**

3. **Configure Environment Variables**:
   In your `.env.local` (or Vercel environment variables):
   ```bash
   VITE_SUPABASE_URL=https://<project-id>.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   VITE_APP_ENV=production
   ```

---

## 2. Database Migrations Execution

Run the versioned migrations in order via the **Supabase SQL Editor**:

### Migration Sequence:

1. **[`supabase/migrations/20261103000001_core_schema.sql`](file:///c:/Users/hp/OneDrive/Desktop/antigravity%20workspace/Coaching%20Saas/supabase/migrations/20261103000001_core_schema.sql)**:
   - Provisions all core relational tables:
     - `public.institutes` (Tenant accounts)
     - `public.profiles` (User metadata linked to `auth.users.id`)
     - `public.memberships` (Tenant-user mapping with roles: `owner`, `admin`, `staff`)
     - `public.batches` (Class cohorts)
     - `public.students` (Enrolled student profiles)
     - `public.attendance_sessions` & `attendance_records` (Daily roll calls)
     - `public.fee_plans` & `payments` (Financial vouchers and payment reversal audit logs)
     - `public.audit_logs` (Immutable audit trail)
     - `public.commercial_subscriptions` (Licensing models A, B, C & student limit quotas)

2. **[`supabase/migrations/20261103000002_multi_tenant_rls.sql`](file:///c:/Users/hp/OneDrive/Desktop/antigravity%20workspace/Coaching%20Saas/supabase/migrations/20261103000002_multi_tenant_rls.sql)**:
   - Enables Row Level Security (RLS) on all 10 tables.
   - Deploys helper functions: `get_user_role(inst_id UUID)` and `user_belongs_to_institute(inst_id UUID)`.
   - Restricts data queries so users can only view and modify records matching their institute membership.
   - Excludes staff from viewing or recording fee payments and audit logs.

3. **[`supabase/migrations/20261103000003_auth_onboarding_and_security.sql`](file:///c:/Users/hp/OneDrive/Desktop/antigravity%20workspace/Coaching%20Saas/supabase/migrations/20261103000003_auth_onboarding_and_security.sql)**:
   - Deploys `public.handle_new_user()` trigger on `auth.users` to automatically populate `public.profiles`.
   - Deploys transactional `public.onboard_institute(...)` stored procedure (`SECURITY DEFINER`) to bootstrap new institute tenants without RLS chicken-and-egg deadlocks.
   - Deploys `public.update_institute_profile(...)` and `public.get_current_user_context()`.

4. **[`supabase/migrations/20261103000004_storage_and_security_hardening.sql`](file:///c:/Users/hp/OneDrive/Desktop/antigravity%20workspace/Coaching%20Saas/supabase/migrations/20261103000004_storage_and_security_hardening.sql)**:
   - Sets up multi-tenant Supabase Storage buckets: `receipts` (private), `documents` (private), and `avatars` (public).
   - Deploys `get_storage_institute_id()` helper enforcing folder paths formatted as `<institute_id>/<subfolder>/<filename>`.
   - Deploys database server-level `prevent_cross_tenant_mutation()` triggers on `students`, `payments`, and `batches` to make cross-tenant data alteration impossible.

5. **[`supabase/migrations/20261103000005_commercial_configuration.sql`](file:///c:/Users/hp/OneDrive/Desktop/antigravity%20workspace/Coaching%20Saas/supabase/migrations/20261103000005_commercial_configuration.sql)**:
   - Adds discrete commercial configuration columns for Model A (SaaS), Model B (Licence), and Model C (Custom Dev).
   - Enforces 7-dimension state separation: purchase model, subscription status, licence status, feature entitlements, student limits, hosting, and support.
   - Adds database check constraint `chk_no_source_code_ownership` verifying `source_code_ownership = false`.
   - Deploys `trg_check_student_quota` trigger on `BEFORE INSERT ON students` halting unauthorized admissions or limit breaches.
   - Deploys server-side stored function `check_module_entitlement(...)`.

> **Unified Alternative**: You can run [`supabase/schema.sql`](file:///c:/Users/hp/OneDrive/Desktop/antigravity%20workspace/Coaching%20Saas/supabase/schema.sql) which concatenates the complete schema, policies, triggers, and stored procedures into a single script.

---

## 3. Supabase Auth Configuration

1. **Authentication Providers**:
   - Go to **Authentication > Providers > Email**.
   - Ensure **Enable Email provider** is toggled ON.
   - Minimum password length: 6 characters (8 recommended).

2. **URL Configuration**:
   - Go to **Authentication > URL Configuration**.
   - **Site URL**: `https://your-domain.vercel.app` (or `http://localhost:5173` during local development).
   - **Redirect URLs**:
     - `http://localhost:5173/**`
     - `https://your-domain.vercel.app/**`

3. **Email Templates**:
   - Customize **Confirm signup** and **Reset password** email templates with your branding.
   - The password reset link directs users to: `{{ .SiteURL }}/login`.

---

## 4. Role-Based Access Control (RBAC) Architecture

| Feature / Resource | Owner (Director) | Admin (Coordinator) | Staff (Faculty) |
| :--- | :---: | :---: | :---: |
| Student Directory | View & Manage | View & Manage | View Only |
| Take Daily Attendance | Allowed | Allowed | Allowed (Assigned Batches) |
| Record Fee Payments | Allowed | Allowed | **DENIED** (Database RLS Blocked) |
| Reverse Payments | Allowed | **DENIED** | **DENIED** (Database RLS Blocked) |
| Financial Reports | Allowed | Allowed | **DENIED** (Database RLS Blocked) |
| Staff Management | Allowed | **DENIED** | **DENIED** (Database RLS Blocked) |
| Institute Profile Settings | Allowed | **DENIED** | **DENIED** (Database RLS Blocked) |
| Audit Logs | Allowed | **DENIED** | **DENIED** (Database RLS Blocked) |
| Commercial Licensing | Allowed | **DENIED** | **DENIED** (Database RLS Blocked) |

---

## 5. Security & Isolation Guarantees

1. **No Service-Role Key Exposure**:
   - `src/lib/supabase.ts` inspects keys at runtime. If a service-role key is provided in client variables, it is immediately discarded and blocked.
2. **Production Enforcement**:
   - When `VITE_APP_ENV=production`, mock demo logins are disabled.
   - All authentication requests require valid Supabase tokens.
3. **Database-Level Enforcement**:
   - Authorization is not just checked on frontend routes: PostgreSQL Row-Level Security rejects any unauthenticated or unauthorized SQL query attempting to bypass frontend filters.

---

## 6. Backup & Recovery Operations

### 6.1 Automated Backups
- Supabase Cloud handles daily automatic backups with 7-day retention on Pro plans and point-in-time recovery (PITR) up to 30 days.

### 6.2 Manual Logical Backups (CLI)
Run pg_dump using the Supabase CLI or direct PostgreSQL connection string:
```bash
# 1. Export schema and all tenant data
pg_dump "postgres://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" \
  --clean --if-exists --no-owner --no-privileges -f "coachingos_backup_$(date +%Y%m%d_%H%M%S).sql"

# 2. Verify backup file size and integrity
gzip "coachingos_backup_$(date +%Y%m%d_%H%M%S).sql"
```

### 6.3 Disaster Recovery Procedure
1. Create a fresh PostgreSQL instance or new Supabase project in the backup region (`ap-south-1` Mumbai or `ap-southeast-1` Singapore).
2. Restore database state:
   ```bash
   psql "postgres://postgres:[NEW-PASSWORD]@db.[NEW-PROJECT-REF].supabase.co:5432/postgres" \
     -f "coachingos_backup_latest.sql"
   ```
3. Update Vercel environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to point to the restored project.
4. Redeploy frontend in Vercel.

---

## 7. Institute Onboarding Playbook

1. **Owner Signup**:
   - New coaching institute owner signs up via `/login` ("Create Institute Account").
   - Triggers `onboard_institute(...)` stored procedure which creates institute, owner membership, default commercial tier (Growth), and default batches in a single atomic transaction.
2. **Academic Configuration**:
   - Owner configures coaching archetype (K-12 CBSE, JEE/NEET, Commerce, Skills) and receipt prefix (`RCP-2026-`).
3. **Cohort Setup**:
   - Owner/Admin creates batches with timing, room, and capacity limit.
4. **Staff & Faculty Onboarding**:
   - Add faculty members via `/staff`. Faculty receive restricted logins allowing attendance marking for assigned cohorts only.
5. **Student Admissions & Fee Plans**:
   - Enroll students or upload batch roster.
   - Assign fee packages (Monthly / Quarterly / Annual) with authorized concessions.
6. **First Payment Voucher**:
   - Record registration/tuition fee instalment and issue official printed voucher.

