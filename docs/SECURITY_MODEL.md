# FIXIA EduOS — Security Model, Authorization Architecture & RLS Blueprint

**Document Version:** 1.0.0  
**Status:** Approved Security Architecture  
**Core Standard:** Defense-in-Depth (Kernel-level PostgreSQL Row Level Security + Server-Side Validation)  
**Author:** Principal Security Architect & Lead DevSecOps Engineer  

---

## 1. The Four-Layer Authorization Architecture

A hidden frontend button is not security. If a malicious or curious user opens their browser developer tools and executes a direct HTTP/PostgREST mutation, the operation must be halted at the database kernel level.

In FIXIA EduOS, every operation must satisfy all four authorization layers before access is granted:

```
+=========================================================================================+
|                               FOUR-LAYER AUTHORIZATION MODEL                            |
+=========================================================================================+
                                            |
                                            v
+-----------------------------------------------------------------------------------------+
| LAYER 1: AUTHENTICATION                                                                 |
| "Is the caller an authenticated user with a verified identity?"                        |
| - Handled by Supabase Auth (PKCE / JWT verification).                                  |
| - Verifies `auth.uid() IS NOT NULL` and cryptographic JWT signature.                   |
+-----------------------------------------------------------------------------------------+
                                            |
                                            v
+-----------------------------------------------------------------------------------------+
| LAYER 2: TENANT MEMBERSHIP                                                              |
| "Does the caller belong to the requested institute workspace?"                         |
| - Verifies `public.is_tenant_member(tenant_id) = TRUE`.                                 |
| - Prevents Tenant A from querying or mutating records belonging to Tenant B.           |
+-----------------------------------------------------------------------------------------+
                                            |
                                            v
+-----------------------------------------------------------------------------------------+
| LAYER 3: ROLE & BRANCH PERMISSIONS                                                      |
| "Does the caller's role and assigned branch authorize this specific action?"           |
| - Teachers can ONLY view and mark attendance for assigned batches.                      |
| - Accountants can record payments, but CANNOT reverse payments or alter settings.       |
| - Branch Managers are restricted to their assigned `branch_id`.                         |
+-----------------------------------------------------------------------------------------+
                                            |
                                            v
+-----------------------------------------------------------------------------------------+
| LAYER 4: COMMERCIAL FEATURE ENTITLEMENTS                                                |
| "Does the institute's active subscription plan permit this capability and quota?"      |
| - Database trigger `trg_check_student_quota` halts admissions exceeding plan limits.    |
| - Feature flags check `tenant_entitlements` (e.g. `public_website.enabled`).            |
+-----------------------------------------------------------------------------------------+
                                            |
                                            v
                               [ ACCESS GRANTED ]
```

---

## 2. Row Level Security (RLS) Helper Functions

To avoid recursive RLS evaluations and optimize PostgreSQL query planner execution, policies leverage clean, security-conscious database functions:

```sql
-- Helper 1: Verify whether the caller has active membership in the target tenant
CREATE OR REPLACE FUNCTION public.is_tenant_member(target_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.tenant_memberships tm
        WHERE tm.tenant_id = target_tenant_id
          AND tm.user_id = (SELECT auth.uid())
          AND tm.status = 'active'
    );
$$;

-- Helper 2: Retrieve the caller's active role within a specific tenant
CREATE OR REPLACE FUNCTION public.get_tenant_role(target_tenant_id UUID)
RETURNS VARCHAR
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
    SELECT tm.role
    FROM public.tenant_memberships tm
    WHERE tm.tenant_id = target_tenant_id
      AND tm.user_id = (SELECT auth.uid())
      AND tm.status = 'active'
    LIMIT 1;
$$;

-- Helper 3: Verify if the caller is an authenticated FIXIA Platform Super Admin
CREATE OR REPLACE FUNCTION public.is_platform_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.platform_admins pa
        WHERE pa.user_id = (SELECT auth.uid())
          AND pa.is_active = TRUE
          AND pa.role IN ('super_admin', 'platform_admin')
    );
$$;

-- Helper 4: Verify whether a teacher is assigned to a specific batch
CREATE OR REPLACE FUNCTION public.is_teacher_assigned(target_tenant_id UUID, target_batch_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.teacher_assignments ta
        WHERE ta.tenant_id = target_tenant_id
          AND ta.batch_id = target_batch_id
          AND ta.teacher_user_id = (SELECT auth.uid())
    ) OR EXISTS (
        SELECT 1
        FROM public.batches b
        WHERE b.id = target_batch_id
          AND b.tenant_id = target_tenant_id
          AND b.instructor_user_id = (SELECT auth.uid())
    );
$$;
```

---

## 3. Core RLS Policy Patterns

### 3.1 Tenant Data Scoping (Baseline)
```sql
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view courses"
    ON public.courses FOR SELECT
    TO authenticated
    USING (
        public.is_platform_super_admin()
        OR public.is_tenant_member(tenant_id)
    );

CREATE POLICY "Authorized administrators can modify courses"
    ON public.courses FOR ALL
    TO authenticated
    USING (
        public.is_platform_super_admin()
        OR (public.is_tenant_member(tenant_id) AND public.get_tenant_role(tenant_id) IN ('owner', 'admin'))
    )
    WITH CHECK (
        public.is_platform_super_admin()
        OR (public.is_tenant_member(tenant_id) AND public.get_tenant_role(tenant_id) IN ('owner', 'admin'))
    );
```

### 3.2 Strict Teacher Scoping on Student Records
Teachers are prevented from viewing students outside their assigned batches:
```sql
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students select policy: Admins view all, Teachers view assigned"
    ON public.students FOR SELECT
    TO authenticated
    USING (
        public.is_platform_super_admin()
        OR (public.is_tenant_member(tenant_id) AND public.get_tenant_role(tenant_id) IN ('owner', 'admin', 'accountant', 'receptionist'))
        OR (
            public.is_tenant_member(tenant_id)
            AND public.get_tenant_role(tenant_id) = 'teacher'
            AND EXISTS (
                SELECT 1 FROM public.batch_enrollments be
                WHERE be.student_id = students.id
                  AND be.tenant_id = students.tenant_id
                  AND be.status = 'active'
                  AND public.is_teacher_assigned(be.tenant_id, be.batch_id)
            )
        )
        OR (
            -- Student views self
            user_id = (SELECT auth.uid())
        )
    );
```

### 3.3 Financial Data Fortress (Zero Teacher Access)
```sql
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Payments select policy: Financial staff and owners only"
    ON public.payments FOR SELECT
    TO authenticated
    USING (
        public.is_platform_super_admin()
        OR (
            public.is_tenant_member(tenant_id) 
            AND public.get_tenant_role(tenant_id) IN ('owner', 'admin', 'accountant')
        )
    );
-- Notice: Teachers receive 0 rows from this query.
```

### 3.4 Commercial Subscription Quota Protection
Tenant owners have read-only access to their quotas; updates are restricted to Super Admins:
```sql
ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can inspect their own subscription"
    ON public.tenant_subscriptions FOR SELECT
    TO authenticated
    USING (
        public.is_platform_super_admin()
        OR public.is_tenant_member(tenant_id)
    );

CREATE POLICY "Only Super Admins can update commercial subscriptions"
    ON public.tenant_subscriptions FOR ALL
    TO authenticated
    USING (public.is_platform_super_admin())
    WITH CHECK (public.is_platform_super_admin());
```

---

## 4. Supabase Storage Security & Policies

File uploads are categorized into private and public buckets with strict folder paths:

| Bucket Name | Privacy | Path Structure | Allowed File Types |
| :--- | :--- | :--- | :--- |
| `receipts` | **Private** | `/{tenant_id}/receipts/{payment_id}.pdf` | PDF |
| `student-documents`| **Private** | `/{tenant_id}/students/{student_id}/{doc_id}.pdf` | PDF, JPEG, PNG |
| `vouchers` | **Private** | `/{tenant_id}/vouchers/{voucher_id}.pdf` | PDF, JPEG, PNG |
| `institute-assets` | **Public** | `/{tenant_id}/branding/{filename}.png` | PNG, SVG, WebP |

### Storage Object Policy Pattern
```sql
-- Allow authenticated tenant members to download their own student documents
CREATE POLICY "Tenant members can view their private documents"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'student-documents'
        AND public.is_tenant_member((storage.foldername(name))[1]::UUID)
    );
```

---

## 5. Non-Negotiable Security Invariants

1. **Zero Service-Role Key Leakage:** The Supabase `service_role` secret must never be committed to git, loaded into Vite environment variables, or bundled into frontend JavaScript. The client contains an automated startup assertion that throws a runtime error if a service-role key is provided.
2. **Never Trust Browser Role Claims:** The user's role is never derived from client-side cookies, request headers, or editable `user_metadata`. It is resolved dynamically from `tenant_memberships` in PostgreSQL.
3. **Audit Trail Immutability:** All status adjustments (student transfers, payment reversals, expense voiding, and quota changes) must write an immutable record to `audit_logs` capturing actor ID, timestamp, and mandatory justification reason.
4. **Idempotency Protection:** Payment and admission creation endpoints enforce idempotency tokens to prevent accidental double-billing or duplicate student admissions on network retries.
