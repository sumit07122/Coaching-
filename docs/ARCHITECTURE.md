# FIXIA CoachingOS — Multi-Tenant SaaS Architecture Blueprint

## 1. High-Level System Architecture

```
[ Institute Owner / Staff Browser ]
               │
       HTTPS / TLS 1.3
               ▼
   [ Cloudflare Edge / WAF ]
   - Custom Subdomains (*.fixia.in)
   - SSL Termination & DDoS mitigation
               │
               ▼
     [ API Gateway (Traefik / NGINX) ]
               │
  ┌────────────┴────────────┐
  ▼                         ▼
[ Authentication Svc ]    [ Core API Service ]
- JWT with Tenant Claims   - Fast Node.js / NestJS or Go
- Tenant Slug Resolver    - Business Logic
- RBAC Enforcement        - Attendance & Fee Calculators
  │                         │
  └────────────┬────────────┘
               ▼
[ Multi-Tenant PostgreSQL 16+ with Row-Level Security (RLS) ]
  - Tenant Data Isolation via `tenant_id`
  - Automated Nightly Backups
  - Connection Pooler (PgBouncer)
               │
  ┌────────────┴────────────┐
  ▼                         ▼
[ Object Storage (S3 / R2) ] [ WhatsApp Cloud API Gateway ]
- Student photos            - Meta WhatsApp Business API
- PDF Receipt Archives      - Automated receipt & reminder delivery
```

---

## 2. Multi-Tenancy Strategy: Hybrid Pooled with Row-Level Security (RLS)

### Why Pooled Database with PostgreSQL RLS?
For coaching institutes with < 100 students paying ₹999–₹2,499/month, dedicated databases per tenant would be cost-prohibitive and operationally complex. Instead:
- All tenants share the same PostgreSQL database cluster.
- Every table has a mandatory `tenant_id UUID NOT NULL REFERENCES institutes(id)`.
- PostgreSQL **Row Level Security (RLS)** is enabled on all tables:
  ```sql
  ALTER TABLE students ENABLE ROW LEVEL SECURITY;
  
  CREATE POLICY tenant_isolation_policy ON students
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
  ```
- Before executing queries, the connection pooler or middleware executes:
  ```sql
  SET LOCAL app.current_tenant_id = 'c4b8b6e2-...';
  ```
- This guarantees data isolation at the database kernel level: no query can accidentally leak records between institutes.

---

## 3. Subdomain Routing & Tenant Resolution
- Each institute receives a unique tenant slug during onboarding (e.g. `radheya.fixia.in`).
- For higher-tier plans, custom domains are supported (e.g. `portal.sharmaclasses.com`) using Cloudflare SSL for SaaS.
- The API gateway inspects the `Host` header and resolves it to `tenant_id` using an in-memory Redis cache (TTL 10 minutes).

---

## 4. Role-Based Access Control (RBAC) Matrix

| Capability | Institute Owner | Front-Desk Admin | Teaching Faculty |
| :--- | :---: | :---: | :---: |
| View Financial Dashboards & Revenue | ✅ | ❌ | ❌ |
| Record Fee Payments & Issue Receipts | ✅ | ✅ | ❌ |
| Manage Fee Plans & Discount Policies | ✅ | ❌ | ❌ |
| Student Admissions & Edits | ✅ | ✅ | ❌ |
| View Student Contact Info | ✅ | ✅ | ✅ (Assigned only) |
| Take Daily Batch Attendance | ✅ | ✅ | ✅ (Assigned only) |
| Create / Delete Batches | ✅ | ❌ | ❌ |
| Configure Institute Profile & Settings | ✅ | ❌ | ❌ |
| Reset Institute Data | ✅ (With 2FA) | ❌ | ❌ |

---

## 5. Commercial Packaging & Business Models Architecture

FIXIA CoachingOS operates a unified multi-tenant codebase that cleanly accommodates three distinct commercial delivery models without branching or code forks.

### 5.1 Three Supported Commercial Models

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       FIXIA CoachingOS Unified Core                         │
│   (React 19 + TypeScript + Vite + Supabase PostgreSQL RLS + Common Schema)  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
     ┌─────────────────────────────────┼────────────────────────────────┐
     ▼                                 ▼                                ▼
[ MODEL A: SaaS ]            [ MODEL B: Licence ]           [ MODEL C: Custom Dev ]
- Setup fee + Recurring      - One-time licence fee         - Bespoke requirements
- Monthly / Annual cycle     - Annual AMC maintenance       - Separate quotation (INR)
- Fixia Cloud hosted         - Self-hosted / VPS            - Milestone delivery lifecycle
- Automated upgrades         - Bound to licensed version    - Scope & delivery agreements
- Dynamic student quotas     - Cryptographic licence key    - Custom SLA contracts
```

#### MODEL A — SaaS Subscription
- **Commercial Structure**: One-time onboarding setup fee (`setupFeePaid`) plus recurring monthly or annual subscription fees (`recurringAmount`, `billingCycle`).
- **Subscription Lifecycle**: `active`, `past_due`, `canceled`, `trial`, `expired`.
- **Infrastructure**: Managed 100% on Fixia Cloud with automated multi-region backups and continuous zero-downtime rolling upgrades.
- **Support Entitlement**: Tier-based support (`email_standard`, `priority_whatsapp`, or `dedicated_account_manager`).
- **Admissions Enforcement**: Dynamically capped at `studentLimit` (e.g., 100, 300, or unlimited). If past due or quota exceeded, new student admissions are blocked.

#### MODEL B — One-Time Software Licence
- **Commercial Structure**: Perpetual or fixed-term runtime software licence purchase fee (`licencePurchaseFee`) for an agreed student capacity limit (`studentLimit`).
- **Licence Lifecycle**: `active`, `expired`, `suspended`, `pending_activation`.
- **Licence Activation**: Cryptographic licence key string (`licenceKey`) validating the installed version (`licensedVersion`).
- **Maintenance & Upgrades**: Optional Annual Maintenance Contract (AMC) (`maintenanceResponsibility`). Upgrades to major future releases are governed by `upgradeEntitlement`.
- **Hosting Responsibility**: Institute self-hosted (`institute_self_hosted`) on their chosen cloud VPS or local on-premise hardware (`on_premise`).
- **CRITICAL LEGAL & ARCHITECTURAL INVARIANTS**:
  - **No Source Code Ownership**: A software licence grants runtime execution rights only. It explicitly does NOT transfer IP or source code ownership (`sourceCodeOwnership: false` enforced via database constraint `chk_no_source_code_ownership`).
  - **No Lifetime Promises**: No lifetime hosting or unlimited free support promises are ever extended.

#### MODEL C — Custom Development
- **Commercial Structure**: Individually quoted bespoke institute build (`quotationReference`, `quotationAmount` in ₹ INR).
- **Milestone Delivery Lifecycle**: Governed by formal delivery stages:
  1. `discovery`: Requirements workshops and specification sign-off.
  2. `in_development`: Architecture implementation and custom feature coding.
  3. `testing`: Multi-tenant isolation testing and user acceptance tests (UAT).
  4. `delivered`: Deployed to production or customer infrastructure.
  5. `accepted`: Customer acceptance sign-off and warranty commencement.
- **Scope & Agreements**: Specific agreed scope (`definedScope`), delivery target dates (`deliveryDate`), release notes (`deliveryNotes`), and contractually defined support agreements (`supportAgreement`).

---

### 5.2 Strict Separation of Concerns (The 7 Dimensions)

To prevent commercial anti-patterns (such as conflating subscription payment status with software licence validity), FIXIA CoachingOS strictly separates the following 7 dimensions across types, database schema, and runtime context:

| # | Dimension | Field Name | Permitted Values / Type | Purpose |
| :-: | :--- | :--- | :--- | :--- |
| **1** | **Purchase Model** | `modelType` | `saas_subscription`, `one_time_licence`, `custom_development` | Business engagement paradigm |
| **2** | **Subscription Status** | `subscriptionStatus` | `active`, `past_due`, `canceled`, `trial`, `expired`, `not_applicable` | SaaS billing recurring lifecycle |
| **3** | **Licence Status** | `licenceStatus` | `active`, `expired`, `suspended`, `pending_activation`, `not_applicable` | Software runtime permission status |
| **4** | **Feature Entitlements** | `enabledModules` | Array: `students`, `batches`, `attendance`, `fees`, `reports`, `staff` | Granular module authorization |
| **5** | **Student Capacity Limit**| `studentLimit` | Integer (e.g. 100, 250, 500, 999999) | Hard ceiling on active student admissions |
| **6** | **Hosting Responsibility**| `hostingResponsibility` | `fixia_cloud`, `institute_self_hosted`, `dedicated_vps`, `on_premise` | Infrastructure provisioning ownership |
| **7** | **Support Entitlement** | `supportEntitlement` | `email_standard`, `priority_whatsapp`, `dedicated_account_manager`, `none_community` | Contractual SLA support tier |

---

### 5.3 Server & Database Kernel Enforcement (`20261103000005_commercial_configuration.sql`)

Security and commercial quotas are enforced at the PostgreSQL database kernel level, ensuring frontend bypasses or direct API mutations cannot violate commercial terms:

1. **Immutable IP Protection Constraint**:
   ```sql
   ALTER TABLE commercial_subscriptions
     ADD CONSTRAINT chk_no_source_code_ownership 
     CHECK (source_code_ownership = false);
   ```
2. **Database Student Quota Trigger (`trg_check_student_quota`)**:
   - Executes `BEFORE INSERT ON students`.
   - Inspects `commercial_subscriptions` for the matching `institute_id`.
   - Verifies active billing/licence status.
   - Counts existing active students. If `active_students >= student_limit`, execution is aborted:
   ```sql
   RAISE EXCEPTION 'Student admissions quota exceeded. Plan limit: %', v_limit
     USING ERRCODE = 'P0001';
   ```
3. **Module Entitlement Server Function**:
   - Stored procedure `check_module_entitlement(p_institute_id UUID, p_module_name TEXT) RETURNS BOOLEAN`
   - Queries `enabled_modules ? p_module_name` to validate whether a tenant has contracted access to a given feature (e.g. `fees`, `reports`).

---

## 6. Hosting & Support Responsibilities

- **Fixia Cloud Infrastructure (Model A):** Hosted in AWS Mumbai (`ap-south-1`) ensuring < 50ms latency across Northern India.
- **Client-Hosted Infrastructure (Model B / C):** Deployed via containerized Docker Compose or standalone Node runtime on client-provided Ubuntu LTS instances. Backup scripts export automated PostgreSQL pg_dump dumps locally or to client S3/Google Cloud Storage buckets.
- **Data Protection:** Automated daily encrypted snapshots saved to AWS S3 Mumbai with cross-region replication to Hyderabad.
- **Offline Reliability:** PWA Service Worker caching enables attendance taking in basement classrooms with weak cell signals, auto-syncing when reconnected.
