# FIXIA EduOS — System Architecture & Modular Monolith Design

**Document Version:** 1.0.0  
**Status:** Approved Architectural Blueprint  
**Architecture Style:** Modular Monolith (Single Repository, Unified Schema, Domain Modules)  
**Author:** Principal Software Architect & Lead Security Engineer  

---

## 1. High-Level Architectural Topology

FIXIA EduOS is intentionally architected as a **Modular Monolith** rather than a distributed set of microservices. This guarantees strict multi-tenant transactional consistency, unified Row Level Security, minimal operational overhead, and simplified deployments on modern cloud infrastructure.

```
+---------------------------------------------------------------------------------------------------+
|                                      CLIENT APPLICATION TIER                                      |
|                                    React 19 + TypeScript + Vite                                   |
|                             Tailwind CSS + shadcn/ui Component System                             |
+---------------------------------------------------------------------------------------------------+
        |                                       |                                       |
        v                                       v                                       v
+-------------------------------+   +-------------------------------+   +-------------------------------+
|      EXPERIENCE 1:            |   |      EXPERIENCE 2:            |   |      EXPERIENCE 3:            |
|   FIXIA SUPER ADMIN           |   |   INSTITUTE OPERATIONS APP    |   |   PUBLIC INSTITUTE WEBSITE    |
|   (/superadmin/*)             |   |   (/, /students, /fees, etc.) |   |   (academy.fixia.in)          |
+-------------------------------+   +-------------------------------+   +-------------------------------+
        \                                       |                                       /
         \                                      v                                      /
          +---------------------------------------------------------------------------+
          |                      SHARED APPLICATION SHELL & ROUTER                     |
          |       Auth Guards | Tenant Switcher | Error Boundaries | UI Providers      |
          +---------------------------------------------------------------------------+
                                                |
                                                v
          +---------------------------------------------------------------------------+
          |                       DOMAIN SERVICE LAYER (Typed Data API)                |
          |   studentsService | feesService | attendanceService | entitlementsService  |
          +---------------------------------------------------------------------------+
                                                |
                               HTTPS (TLS 1.3) / WebSocket (Realtime)
                                                v
+---------------------------------------------------------------------------------------------------+
|                                  SUPABASE CLOUD INFRASTRUCTURE                                    |
|                                                                                                   |
|  +-----------------------------+  +-----------------------------+  +---------------------------+  |
|  |       Supabase Auth         |  |    PostgreSQL 15+ & RLS     |  |     Supabase Storage      |  |
|  |  JWT, PKCE, Email Provider  |  |  Multi-Tenant Isolated Rows |  |  receipts, vouchers, docs |  |
|  +-----------------------------+  +-----------------------------+  +---------------------------+  |
|                                                |                                                  |
|                                 +-------------------------------+                                 |
|                                 |    Supabase Edge Functions    |                                 |
|                                 | Privileged Ops, Invitations   |                                 |
|                                 +-------------------------------+                                 |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Shared Application Shell & Three Experiences

All three experiences live in one repository, sharing domain models, validation schemas, and database types:

### Experience 1: FIXIA Super Admin Platform (`/superadmin/*`)
- **Target Audience:** FIXIA platform engineers, customer support, and billing operations.
- **Capabilities:** Platform aggregate metrics, tenant management, subscription assignments, student quota limits, Model B perpetual license generation, and privileged platform audit trails.
- **Security:** Completely isolated from tenant routes; requires `role = 'super_admin'`.

### Experience 2: Institute Operations Application (`/*` and `/teacher/*`)
- **Target Audience:** Institute Owners, Operations Admins, Accountants, Receptionists, Teachers, Students, and Parents.
- **Capabilities:** Core daily operations including admissions, batch allocation, timetable scheduling, roll-call attendance, fee installments, receipts, expenses, exams, and reports.
- **Security:** Scoped strictly by `tenant_id` and membership role. Teachers receive a dedicated mobile-first roll-call experience (`/teacher/*`).

### Experience 3: Optional Public Institute Website (`slug.fixia.in` or `/site/*`)
- **Target Audience:** Prospective students and parents seeking course details, faculty profiles, and admission contact forms.
- **Capabilities:** Marketing showcase, course offerings, branch details, WhatsApp contact links, and lead capture.
- **Security:** Governed by `tenant_entitlements` (`public_website.enabled`). Read-only public access to explicitly published content; zero access to private student or fee data.

---

## 3. Recommended Repository Structure (Modular Monolith)

To prevent giant components and unorganized file structures, the repository will evolve into a clean domain-driven architecture:

```
eduos/
├── public/                     # Static assets, PWA manifest, favicons
├── src/
│   ├── app/                    # Application Shell & Core Setup
│   │   ├── router/             # React Router v6/v7 route definitions
│   │   ├── providers/          # Context providers (Auth, App, Theme)
│   │   └── guards/             # Route protection guards (AuthGuard, RoleGuard, EntitlementGuard)
│   │
│   ├── components/             # Reusable UI Component Library
│   │   ├── ui/                 # Atomic primitives (Button, Card, Input, Modal, Badge)
│   │   ├── forms/              # Form controls with react-hook-form + Zod
│   │   ├── tables/             # Data tables with sorting, filtering, and pagination
│   │   └── layouts/            # Layout shells (AppLayout, TeacherLayout, SuperAdminLayout)
│   │
│   ├── modules/                # Feature Modules (Domain-Driven Encapsulation)
│   │   ├── super-admin/        # Platform governance, fleet overview, subscriptions
│   │   ├── onboarding/         # Institute registration and workspace wizard
│   │   ├── dashboard/          # Analytics overview and actionable alerts
│   │   ├── admissions/         # Lead capture, enquiry follow-ups, and conversion
│   │   ├── students/           # Profiles, admissions, documents, transfers
│   │   ├── courses/            # Course definitions, subjects, and fees
│   │   ├── batches/            # Cohort scheduling, rooms, capacity management
│   │   ├── attendance/         # Roll-call terminal, monthly logs, audit corrections
│   │   ├── fees/               # Structures, installments, payments, receipts, reversals
│   │   ├── expenses/           # Outflow vouchers, categories, P&L Net Operating Income
│   │   ├── examinations/       # Exams, mark entry, grade calculation, publishing
│   │   ├── staff/              # Staff profiles, roles, teacher-to-batch assignment
│   │   ├── communication/      # Notices, in-app notifications, WhatsApp links
│   │   ├── website/            # Public institute website builder and pages
│   │   └── settings/           # Institute profile, branding, academic sessions
│   │
│   ├── services/               # Typed Data-Access & Domain Services Layer
│   │   ├── supabase/           # Client configuration and base client
│   │   ├── permissions/        # Client-side RBAC evaluation utilities
│   │   ├── entitlements/       # Feature entitlement validation engine
│   │   └── audit/              # Audit logging dispatchers
│   │
│   ├── hooks/                  # Custom React hooks (useAuth, useEntitlement, useDebounce)
│   ├── lib/                    # Third-party wrappers (formatters, date utils, currency math)
│   ├── types/                  # TypeScript interface definitions (database & domain)
│   └── styles/                 # CSS design system and Tailwind directives
│
├── supabase/
│   ├── migrations/             # Timestamped, forward-only PostgreSQL migrations
│   ├── functions/              # Supabase Edge Functions (e.g. invite-staff, razorpay-webhook)
│   ├── SETUP_COMPLETE_DATABASE.sql # Consolidated single-run schema setup
│   └── seed.sql                # Deterministic local development seed data
│
├── docs/                       # Architectural specifications and runbooks
├── .env.example                # Example environment variables
├── package.json
└── vite.config.ts
```

> [!IMPORTANT]
> **No Database Calls in UI Components:** All data mutations and queries must reside in typed domain services under `src/services/` (e.g. `studentsService.ts`, `feesService.ts`). React components consume services via hooks.

---

## 4. Multi-Tenant Architecture & Data Isolation

### 4.1 Tenant Scoping Model
Every tenant-owned table in the database includes a mandatory `tenant_id` foreign key referencing `public.tenants(id)`.

```
                         [ public.tenants ]
                                 |
         +-----------------------+-----------------------+
         |                       |                       |
         v                       v                       v
[ public.students ]     [ public.courses ]      [ public.payments ]
 (tenant_id = X)         (tenant_id = X)         (tenant_id = X)
```

### 4.2 Composite Uniqueness & Cross-Tenant Leakage Prevention
To prevent a user from linking a student from Tenant A to a batch from Tenant B, composite unique constraints and foreign keys are used:
```sql
-- Ensure batch uniqueness within tenant
ALTER TABLE public.batches 
    ADD CONSTRAINT uq_batches_tenant_id UNIQUE (tenant_id, id);

-- Ensure enrollment foreign key validates tenant matching
ALTER TABLE public.batch_enrollments 
    ADD CONSTRAINT fk_enrollment_batch_tenant 
    FOREIGN KEY (tenant_id, batch_id) 
    REFERENCES public.batches (tenant_id, id) ON DELETE CASCADE;
```

### 4.3 Multi-Institute Membership
Users have a single authentication identity (`profiles.id` = `auth.users.id`). A user can hold memberships across multiple institutes simultaneously:
```sql
CREATE TABLE public.tenant_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    UNIQUE (tenant_id, user_id)
);
```
When a user logs in, they select their active institute workspace; the client presents data strictly for that active `tenant_id`.

---

## 5. Technology Stack Rationale

| Layer | Selected Technology | Architectural Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19 + TypeScript** | Strict type safety, high developer velocity, rich ecosystem for data tables and charts. |
| **Bundler & Tooling** | **Vite 8** | Sub-second Hot Module Replacement (HMR), tree-shaking, automated route code-splitting. |
| **Styling & UI System** | **Tailwind CSS + shadcn/ui** | Clean, accessible primitives, zero runtime style overhead, enterprise-grade dark/light modes. |
| **Backend Database** | **Supabase PostgreSQL 15+** | Relational integrity, triggers, stored procedures, JSONB support, enterprise reliability. |
| **Access Control** | **PostgreSQL Row Level Security (RLS)** | Kernel-level data isolation. Security is enforced by PostgreSQL even if API queries are tampered with. |
| **Authentication** | **Supabase Auth (PKCE / JWT)** | Secure sessions, email verification, password reset, multi-factor authentication ready. |
| **File Storage** | **Supabase Storage (S3)** | Private buckets for receipts and documents; public buckets for branding logos. |
| **Privileged Operations** | **Supabase Edge Functions (Deno)** | Server-side execution with service-role privileges (e.g. teacher invites, payment webhook verification). |
| **Deployment Platform** | **Vercel** | Global Anycast Edge CDN, automatic SPA rewrites, zero-downtime atomic rollouts. |
