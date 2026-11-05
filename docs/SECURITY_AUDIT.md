# FIXIA CoachingOS — Security & Multi-Tenant Audit Report

**Date**: November 2026  
**Auditor**: FIXIA SaaS Architecture & Security Team  
**Scope**: Multi-Tenant Isolation, Row-Level Security (RLS), Role-Based Access Control (RBAC), Secrets Management & Frontend Security Barriers.

---

## Executive Summary

FIXIA CoachingOS is an institute management SaaS designed for multi-tenancy. This security audit documents the layers of defense implemented to guarantee that no institute's sensitive student or financial records can be accessed, leaked, or modified across tenant boundaries.

All security assertions are verified both at the database level (PostgreSQL RLS policies) and through automated Vitest test suites (`src/tests/tenant-isolation.test.ts`).

---

## 1. Multi-Tenant Isolation Architecture

### 1.1 Shared Database, Separate Tenants
The application uses a shared PostgreSQL schema where every entity table contains a mandatory, non-null `institute_id` foreign key referencing the `institutes` table:

```sql
institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE
```

### 1.2 Row-Level Security (RLS) Policies
Row-Level Security is enabled across all 10 core tables:
- `institutes`
- `profiles`
- `memberships`
- `batches`
- `students`
- `attendance_sessions`
- `attendance_records`
- `fee_plans`
- `payments`
- `audit_logs`
- `commercial_subscriptions`

#### Context Helper Functions
```sql
CREATE OR REPLACE FUNCTION auth.current_institute_id()
RETURNS UUID AS $$
  SELECT institute_id FROM public.memberships
  WHERE user_id = auth.uid() AND status = 'active'
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

#### Isolation Policy Verification
Every table includes a tenant isolation policy:
```sql
CREATE POLICY "tenant_isolation_students" ON public.students
  FOR ALL
  USING (institute_id = auth.current_institute_id())
  WITH CHECK (institute_id = auth.current_institute_id());
```

**Audit Result**: PASS. Queries issued by a tenant cannot return rows matching another `institute_id` even if foreign keys or IDs are guessed or enumerated.

---

## 2. Role-Based Access Control (RBAC) Audit

Three roles exist per institute: `owner`, `admin`, and `staff`.

| Capability / Resource | Owner (Director) | Admin (Coordinator) | Staff (Faculty) |
| :--- | :---: | :---: | :---: |
| View Student Directory | Allowed | Allowed | Allowed |
| Admit / Edit Student | Allowed | Allowed | Denied |
| Take Daily Attendance | Allowed | Allowed | Allowed (Assigned Batches) |
| Record Fee Payments | Allowed | Allowed | Denied |
| Reverse Payments | Allowed | Denied | Denied |
| View Financial Reports | Allowed | Allowed | Denied |
| Manage Staff & Roles | Allowed | Denied | Denied |
| Commercial Subscription / Licensing | Allowed | Denied | Denied |
| View Immutable Audit Trail | Allowed | Denied | Denied |

**Audit Result**: PASS. Both backend RLS (`auth.current_role() = 'owner'`) and frontend ProtectedRoute components enforce strict barriers.

---

## 3. Storage File Isolation & Protection

Institute vouchers, student documents, and financial records stored in Supabase Storage (`storage.objects`) are strictly isolated by tenant folder root (`<institute_id>/...`):

1. **Storage Read Policy (`Tenant storage read policy`)**:
   - Private buckets (`receipts`, `documents`) require active caller membership in the target institute.
   - Institute A cannot view, download, or guess URLs to Institute B's receipts.
2. **Storage Upload Policy (`Tenant storage insert policy`)**:
   - Restricts uploads strictly to the folder path matching the caller's active institute.
   - For fee receipts and identity documents, only `owner` and `admin` roles are authorized to upload.
3. **Storage Deletion Policy (`Tenant storage delete policy`)**:
   - Only institute `owner` can delete storage files, preventing rogue or accidental deletion by staff.

---

## 4. Database Server-Level Protection & Immutability Triggers

Beyond table-level Row-Level Security, database triggers enforce immutable multi-tenant boundaries:
- `prevent_cross_tenant_mutation()` trigger attached to `students`, `payments`, and `batches`:
  - Rejects any SQL `UPDATE` attempt where `NEW.institute_id != OLD.institute_id` (blocks tenant re-assignment tampering).
  - Verifies that the updating session actively belongs to `OLD.institute_id`.

---

## 5. Financial Integrity & Reversal Protection

### 5.1 Non-Destructive Payment Reversals
Financial transactions in FIXIA CoachingOS are immutable. Once a fee payment is recorded:
- The transaction cannot be deleted.
- If a mistake was made (e.g. cheque bounce, wrong entry), only an `owner` can issue a **Payment Reversal**.
- The reversal requires an auditable reason (minimum 5 characters).
- Reversals automatically create a debit entry, adjust student `totalFeePaid` and `balanceFee`, and append a permanent audit log entry.

### 5.2 Automated Calculation Invariants
Vitest automated calculations verify that:
- `balanceFee = totalFeeInvoiced - totalFeePaid`
- Negative balances are prohibited.
- Partial payments correctly recalculate fee status:
  - `totalFeePaid == 0` -> `overdue` / `pending`
  - `0 < totalFeePaid < totalFeeInvoiced` -> `partial`
  - `totalFeePaid >= totalFeeInvoiced` -> `paid`

---

## 6. Frontend & Application Security

### 6.1 Zero Hardcoded Secrets & Service-Role Guard
- Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are exposed client-side.
- Runtime inspection in `src/lib/supabase.ts` detects and rejects any Supabase service-role key.
- Supabase Service Role keys are **never** bundled into the client build.

### 6.2 Route Guards & Session Expiry
- `src/components/auth/ProtectedRoute.tsx` guards authenticated routes.
- Unauthorized attempts to navigate to `/staff` or `/settings` redirect with an explicit Access Denied notice.

### 6.3 Input Validation
- Forms for staff invitations and student admissions use strict validation schemas via **React Hook Form + Zod** and custom sanitizers preventing script injection.

---

## 7. Verification Test Suite Status

The automated test suite runs during CI/CD before any production build:

```bash
npm run test -- --run
```

**Results**:
- `src/tests/production-readiness.test.ts`: 12 tests passed (service-role neutralization, tenant attribution, storage isolation, RBAC barriers, check constraints, financial math, pagination bounds, empty states, currency formatting).
- `src/tests/commercial-licensing.test.ts`: 13 tests passed (Model A SaaS quotas, Model B licence non-ownership of IP & no lifetime claims, Model C custom dev milestone lifecycle, 7-dimension state separation, server stored procedures).
- `src/tests/fee-management.test.ts`: 24 tests passed (invoicing separation, payments, reversals, unique receipts, debounce, balance ledger updates).
- `src/tests/dashboard-reports-notifications.test.ts`: 20 tests passed (dynamic dashboard metrics, upcoming/overdue dues, audit logs activity stream, 5 report datasets, CSV exports, notification lifecycle).
- `src/tests/crud-modules.test.ts`: 15 tests passed (student admissions with email/address, batch transfers, teacher assignment, staff onboarding, owner deletion protection).
- `src/tests/attendance-module.test.ts`: 12 tests passed (72 present, 13 absent, batch attendance percentages, duplicate session prevention, role authorization).
- `src/tests/supabase-auth.test.ts`: 10 tests passed (service-role rejection, RBAC permissions, onboarding validation, password reset).
- `src/tests/tenant-isolation.test.ts`: 6 tests passed (cross-tenant student/payment/batch protection, storage isolation, unauthenticated blocks).
- `src/tests/calculations.test.ts`: 7 tests passed (financial balances, demo statistics invariants).
- **Total**: 119 tests passed across 9 test suites (0 failures).

---

## 8. Security Audit Sign-Off

| Audit Vector | Implementation Standard | Status |
| :--- | :--- | :---: |
| **Row-Level Security (RLS)** | PostgreSQL 16+ RLS on all 10 core tables with `SECURITY DEFINER` helpers | **VERIFIED** |
| **Tenant Isolation** | Foreign key `institute_id` on every table; cross-tenant updates blocked | **VERIFIED** |
| **Server-Side Immutability** | Trigger `prevent_cross_tenant_mutation` blocks reassignment of `institute_id` | **VERIFIED** |
| **Storage Security** | Folder prefix `/{institute_id}/...` enforced with bucket RLS policies | **VERIFIED** |
| **Service Role Protection** | Runtime JWT inspection rejects service-role keys in frontend initialization | **VERIFIED** |
| **Commercial Quota Protection** | Trigger `trg_check_student_quota` halts admissions at database level | **VERIFIED** |
| **IP Non-Transfer Constraint** | Database constraint `chk_no_source_code_ownership` enforces runtime-only licence | **VERIFIED** |
| **Financial Auditability** | Payments immutable; reversals require reason and create audited debit entry | **VERIFIED** |
| **Form Input Validation** | React Hook Form + Zod schema validation; script tag sanitization | **VERIFIED** |
| **Production Headers** | Vercel configuration deploys X-Frame-Options, X-Content-Type-Options, Referrer-Policy | **VERIFIED** |


