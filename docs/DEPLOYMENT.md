# FIXIA CoachingOS — Production Deployment Guide

This guide details the end-to-end production deployment process for **FIXIA CoachingOS** on **Vercel** and **Supabase Managed PostgreSQL / Auth**.

---

## Architecture Overview

```
                      +-----------------------------+
                      |       Client Browser        |
                      |  React 19 + TypeScript SPA  |
                      +--------------+--------------+
                                     |
                                     v
                        +-------------------------+
                        |   Vercel Global Edge    |
                        | (Static CDN + Rewrites) |
                        +------------+------------+
                                     |
              +----------------------+----------------------+
              |                                             |
              v                                             v
  +------------------------+                   +------------------------+
  |    Supabase Auth       |                   | Supabase PostgreSQL    |
  |  JWT Token Validation  |                   | RLS-Isolated Database  |
  +------------------------+                   +------------------------+
```

---

## 1. Supabase Cloud Configuration

### 1.1 Project Initialization
1. Navigate to [Supabase Console](https://supabase.com/dashboard) and create a new project.
2. Select your deployment region (e.g. `ap-south-1` Mumbai for Indian institutes).
3. Record the generated **Database Password**, **Project URL**, and **Project `anon` Key**.

### 1.2 Database Schema & Migration Execution
Run the versioned SQL migrations in order via the Supabase SQL Editor:

1. **Core Relational Schema**:
   Run [`supabase/migrations/20261103000001_core_schema.sql`](file:///c:/Users/hp/OneDrive/Desktop/antigravity%20workspace/Coaching%20Saas/supabase/migrations/20261103000001_core_schema.sql).
   - Provisions 10 tables: `institutes`, `profiles`, `memberships`, `batches`, `students`, `attendance_sessions`, `attendance_records`, `fee_plans`, `payments`, `audit_logs`, `commercial_subscriptions`.
   - Enforces relational foreign keys, cascade rules, and check constraints (e.g. non-negative balances).

2. **Row-Level Security (RLS) & Multi-Tenant Policies**:
   Run [`supabase/migrations/20261103000002_multi_tenant_rls.sql`](file:///c:/Users/hp/OneDrive/Desktop/antigravity%20workspace/Coaching%20Saas/supabase/migrations/20261103000002_multi_tenant_rls.sql).
   - Enables RLS across all tables.
   - Deploys helper functions `get_user_role(inst_id UUID)` and `user_belongs_to_institute(inst_id UUID)`.
   - Implements strict cross-tenant isolation and role-based policies (`owner`, `admin`, `staff`).

3. **Auth Onboarding, User Sync & Role Functions**:
   Run [`supabase/migrations/20261103000003_auth_onboarding_and_security.sql`](file:///c:/Users/hp/OneDrive/Desktop/antigravity%20workspace/Coaching%20Saas/supabase/migrations/20261103000003_auth_onboarding_and_security.sql).
   - Deploys `public.handle_new_user()` trigger for automated user profile creation.
   - Deploys transactional `public.onboard_institute(...)` stored procedure.

4. **Storage RLS & Cross-Tenant Security Hardening**:
   Run [`supabase/migrations/20261103000004_storage_and_security_hardening.sql`](file:///c:/Users/hp/OneDrive/Desktop/antigravity%20workspace/Coaching%20Saas/supabase/migrations/20261103000004_storage_and_security_hardening.sql).
   - Sets up multi-tenant Supabase Storage buckets: `receipts` (private), `documents` (private), `avatars` (public).
   - Enforces folder prefix access controls and server-level mutation guards (`prevent_cross_tenant_mutation`).

5. **Commercial Configuration & Admissions Quotas**:
   Run [`supabase/migrations/20261103000005_commercial_configuration.sql`](file:///c:/Users/hp/OneDrive/Desktop/antigravity%20workspace/Coaching%20Saas/supabase/migrations/20261103000005_commercial_configuration.sql).
   - Implements 7-dimension state separation for Model A (SaaS), Model B (Licence), and Model C (Custom Dev).
   - Adds constraint `chk_no_source_code_ownership` and trigger `trg_check_student_quota` halting unauthorized student enrollment.

*(Alternatively, run the consolidated [`supabase/schema.sql`](file:///c:/Users/hp/OneDrive/Desktop/antigravity%20workspace/Coaching%20Saas/supabase/schema.sql) in a single run).*

### 1.3 Supabase Authentication Settings
1. Go to **Authentication > URL Configuration**:
   - **Site URL**: `https://coachingos.fixia.in` (or your Vercel deployment URL)
   - **Redirect URLs**: Add `https://coachingos.fixia.in/**` and `http://localhost:5173/**` for development.
2. Go to **Authentication > Providers > Email**:
   - Enable Email Signup.
   - Configure Password Minimum Length to 8 characters.
   - For demo accounts or production launch, customize email templates for password reset.

### 1.4 Supabase Storage
Storage buckets and policies are automatically created by Migration 004:
- `receipts` (Private voucher archive)
- `documents` (Private student registration docs)
- `avatars` (Public student/staff headshots)
Folder hierarchy is enforced as: `/{institute_id}/{subfolder}/{filename}`.

---

## 2. Vercel Deployment

### 2.1 Repository Connection
1. Push this repository to GitHub or GitLab.
2. In the [Vercel Dashboard](https://vercel.com), click **Add New Project** and select the repository.

### 2.2 Build and Output Settings
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 2.3 Environment Variables
Configure the following environment variables in Vercel project settings:

| Variable Name | Environment | Description |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Production, Preview | Your Supabase project URL (e.g. `https://xyz.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Production, Preview | Your Supabase public `anon` key |
| `VITE_APP_ENV` | Production, Preview | Set to `production` |

### 2.4 SPA URL Routing
The repository includes a verified [`vercel.json`](file:///c:/Users/hp/OneDrive/Desktop/antigravity%20workspace/Coaching%20Saas/vercel.json) ensuring that all client-side routes (e.g., `/students`, `/fees`, `/reports`) resolve correctly to `index.html` with immutable asset caching:

```json
{
  "version": 2,
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    }
  ]
}
```

---

## 3. Post-Deployment Smoke Test Script

Once deployed to Vercel, perform the following verification:

1. **Root URL Resolution**: Navigate to the production URL. It should load the Login / Demo terminal.
2. **Demo Persona Entry**: Click "Login as Institute Director (Owner)". Verify immediate authentication and dashboard load.
3. **Metric Integrity**: Verify the invariant demo metrics render:
   - 85 total students
   - 6 active batches
   - 72 present today, 13 absent
   - ₹32,000 collected this month
   - ₹18,500 pending dues
4. **Student Admission & Fee Voucher**:
   - Admit a test student.
   - Record a partial payment (e.g. ₹2,000) and verify the Indian voucher receipt with number-to-words currency formatting.
5. **Attendance Session Roll**:
   - Open Attendance page.
   - Check that the session indicator updates between "Editing saved session" and "New session draft".
6. **Role Guard Verification**:
   - Log out and log in as "Faculty / Staff".
   - Verify that financial reports and institute licensing tabs are blocked with Access Denied UI.

---

## 4. Maintenance & Operations

### Backup & Restore
- Supabase automatically provides point-in-time recovery (PITR) on Pro tiers.
- For manual backups, run:
  ```bash
  supabase db dump -f coachingos_backup_$(date +%Y%m%d).sql
  ```

### Rollbacks
- In Vercel, instant rollback is available by clicking **Promote to Production** on any prior deployment.

