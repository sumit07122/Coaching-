# FIXIA EduOS — Architectural Decision Records (ADRs)

**Document Version:** 1.0.0  
**Status:** Approved & Enforced  
**Applicability:** All FIXIA EduOS Codebases, Databases, and Deployment Pipelines  

---

## Index of Architectural Decision Records

| ADR # | Title | Status | Date | Core Principle |
|---|---|---|---|---|
| **ADR-001** | Modular Monolith vs Distributed Microservices | Approved | 2026-11-10 | Simplicity, single deployable, zero network hop latency |
| **ADR-002** | Multi-Tenancy Strategy: Shared Database, Shared Schema with PostgreSQL RLS | Approved | 2026-11-10 | Scalable cost structure, guaranteed tenant isolation at kernel level |
| **ADR-003** | Dual Onboarding: Super Admin Provisioning + Public Self-Registration | Approved | 2026-11-10 | Maximum acquisition flexibility for Indian education sector |
| **ADR-004** | Unified Platform Engine for Diverse Institute Types | Approved | 2026-11-10 | Single codebase with dynamic terminology & feature flags |
| **ADR-005** | Financial Computation Standard: Strictly Integer Paise | Approved | 2026-11-10 | Mathematical infallibility; elimination of IEEE-754 floating-point errors |
| **ADR-006** | Dynamic Feature Entitlement Engine vs Static Tiers | Approved | 2026-11-10 | Granular feature control without code deployments |
| **ADR-007** | Public Institute Website Subdomain Architecture (`<slug>.fixia.in`) | Approved | 2026-11-10 | Instant zero-config web presence for institutes |
| **ADR-008** | Progressive UI Modernization: CSS Variables to Tailwind CSS & shadcn/ui | Approved | 2026-11-10 | Non-destructive evolution preserving existing 170+ passing tests |
| **ADR-009** | Strict Zero Service-Role Key Client-Side Exposure & Edge Boundary | Approved | 2026-11-10 | Absolute defence against credential compromise and privilege escalation |

---

## ADR-001: Modular Monolith vs Distributed Microservices

### Context & Problem Statement
FIXIA EduOS is an all-in-one management platform covering admissions, academic scheduling, attendance, financial ledgers, examinations, communications, and public websites for coaching institutes. The engineering team must select an architecture that supports rapid feature velocity, low operational overhead, reliable data consistency, and high developer ergonomics without requiring a dedicated Kubernetes DevOps team.

### Decision
We will build FIXIA EduOS as a **Modular Monolith** organized strictly by domain modules (`auth`, `academic`, `students`, `attendance`, `finance`, `exams`, `staff`, `superadmin`, `public-site`). All frontend routes reside in a single React/Vite client application, and all backend storage and logic reside in a unified Supabase PostgreSQL database and associated Edge Functions.

### Options Considered
1. **Distributed Microservices** (Separate services for Auth, Billing, Attendance, etc.):
   * *Rejected:* Introduces extreme distributed transaction complexity (Saga patterns for student fee account creation + enrollment), network latency, multiple container deployments, distributed tracing overhead, and high hosting costs unsuitable for SMB pricing.
2. **Modular Monolith (Chosen):**
   * *Accepted:* Maintains clear domain boundaries in TypeScript and PostgreSQL schemas while preserving ACID transactions, zero network latency between modules, single-command deployments to Vercel, and unified end-to-end testing.

### Consequences
* **Positive:** Atomic cross-domain transactions (e.g., student admission + fee installment generation + batch enrollment in a single SQL transaction); rapid local development; simplified CI/CD pipeline; zero inter-service authentication overhead.
* **Negative / Mitigation:** Risk of code entanglement over time. *Mitigation:* Strict directory structure, barrel exports per domain, and ESLint boundary rules preventing direct cross-domain internal file imports.

---

## ADR-002: Multi-Tenancy Strategy: Shared Database, Shared Schema with PostgreSQL RLS

### Context & Problem Statement
The platform will serve thousands of Indian coaching institutes ranging from solo tutors (20 students) to large academies (5,000+ students across multiple branches). We must choose a multi-tenancy model that guarantees 100% data isolation while maintaining low infrastructure costs and straightforward database maintenance.

### Decision
We adopt the **Shared Database, Shared Schema** multi-tenancy pattern, enforced via **PostgreSQL Row-Level Security (RLS)** and composite keys incorporating `tenant_id UUID NOT NULL`.

### Options Considered
1. **Database-per-Tenant:**
   * *Rejected:* Unmanageable connection pooling costs on serverless; running 1,000 separate PostgreSQL instances or databases is cost-prohibitive.
2. **Schema-per-Tenant:**
   * *Rejected:* Schema migration overhead becomes severe at scale (running DDL across 1,000+ schemas); connection pool exhaustion.
3. **Shared Database, Shared Schema with RLS (Chosen):**
   * *Accepted:* Supported natively by PostgreSQL and Supabase. Every query executes within an authenticated session where the database engine automatically filters rows using `tenant_id = public.is_tenant_member(tenant_id)`.

### Technical Rules
1. Every institute-scoped table MUST possess a non-nullable `tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE`.
2. Every composite unique constraint MUST include `tenant_id` (e.g. `UNIQUE (tenant_id, roll_number)`).
3. Every foreign key relationship to another tenant table MUST be composite `FOREIGN KEY (tenant_id, foreign_id) REFERENCES target_table(tenant_id, id)`.
4. RLS is enabled with `FORCE ROW LEVEL SECURITY` on all tenant tables.

### Consequences
* **Positive:** Instant tenant provisioning (a single row insert into `tenants`); single migration run applies to all tenants; very low memory footprint; database engine prevents cross-tenant data leaks even if frontend developers omit `where tenant_id = ...`.
* **Negative / Mitigation:** Risk of developer misconfiguration in RLS policies. *Mitigation:* Exhaustive automated negative testing suite where User of Tenant A queries tables for Tenant B rows and must receive 0 rows.

---

## ADR-003: Dual Onboarding Strategy: Super Admin Provisioning + Public Self-Registration

### Context & Problem Statement
Coaching institutes in India acquire software through two distinct channels:
1. High-touch sales/partnerships where FIXIA administrators manually onboard the institute, configure their branding, and hand over the keys.
2. Digital marketing and organic self-service where an owner signs up directly online and begins an instant trial.

The system must seamlessly support both onboarding paradigms without duplicate logic or orphaned data states.

### Decision
We implement a **Dual Onboarding Engine** sharing a single transactional core:
* **Workflow A (FIXIA Super Admin Provisioned):** Super Admin creates the tenant in `/superadmin/institutes`, assigns a plan, and issues a cryptographic invite token sent to the owner's email. When accepted, the owner sets their credentials and enters the institute.
* **Workflow B (Public Self-Registration):** Owner visits `/register`, enters institute name, email, and password. The system initiates an atomic transaction creating the tenant, assigning the default "Trial" plan with a 14-day validity, creating the owner's profile, and binding their `tenant_memberships` record with role `owner`.

### Consequences
* **Positive:** Accommodates enterprise sales cycles and self-serve bottom-up SaaS growth in parallel.
* **Negative / Mitigation:** Risk of spam/bot registrations in self-registration. *Mitigation:* Email verification requirement, rate-limiting on `/register`, and captcha protection before tenant creation.

---

## ADR-004: Unified Platform Engine for Diverse Institute Types

### Context & Problem Statement
The platform targets four distinct educational verticals:
1. K-12 Coaching & Tuition Centres (academic grades, subjects, board exams).
2. Competitive Exam Academies (JEE, NEET, UPSC, SSC test batches).
3. Computer & IT Training Institutes (short-term certificate courses, lab batches).
4. Vocational & Skill Academies (dance, music, sports, language training).

Developing separate software codebases or branching the application would cause unmanageable code divergence.

### Decision
We build a **Single Unified Core Engine** where institute type is a configuration property in `tenants.institute_type`. The frontend dynamically adapts vocabulary, default configurations, and feature modules based on this setting:

| Terminology / Config | K-12 Coaching / Tuition | Computer / IT Institute | Skill / Arts Academy |
|---|---|---|---|
| Class Unit | `Batch` / `Class` | `Batch` / `Lab Slot` | `Workshop` / `Session` |
| Curriculum | `Course` & `Subjects` | `Certification Track` | `Program` / `Level` |
| Evaluation | `Exams` & `Report Cards` | `Practical Tests` / `Projects` | `Assessments` / `Recitals` |
| Roll ID | `Roll Number` | `Student ID` | `Member ID` |

### Consequences
* **Positive:** 100% code reuse; single QA and test matrix; bugs fixed once benefit all verticals; easy for an institute offering both tuition and computer training to use one system.
* **Negative / Mitigation:** UI must accommodate varying labels without breaking layout. *Mitigation:* Centralized i18n/vocabulary localization hook (`useTerminology()`) returning context-appropriate nouns.

---

## ADR-005: Financial Computation Standard: Strictly Integer Paise

### Context & Problem Statement
Financial calculations involving fee schedules, monthly installments, partial payments, GST taxation, and refunds are vulnerable to IEEE-754 floating-point rounding errors when stored as `FLOAT`, `DOUBLE`, or handled using standard JavaScript `Number` math (e.g. `0.1 + 0.2 === 0.30000000000000004`). In a financial ledger, discrepancies of even 1 paisa trigger accounting failures, customer disputes, and audit discrepancies.

### Decision
All monetary values across the entire database, API layer, business logic services, and frontend state MUST be represented and calculated strictly as **integer paise** ($1\text{ INR} = 100\text{ paise}$).
* In PostgreSQL: Stored as `BIGINT` or `INTEGER` with `CHECK (amount_paise >= 0)`.
* In TypeScript: Handled as integer numbers or `BigInt`.
* Formatting: Converted to decimal Rupees strictly at the final UI rendering boundary using standard currency utility formatters:
  $$\text{Rupees} = \frac{\text{amount\_paise}}{100}$$

### Verification Standard
* No column named `amount`, `fee`, `price`, or `balance` without the suffix `_paise`.
* Zero use of `FLOAT` or `REAL` database types for monetary values.
* Division operations (e.g., installment split, GST proportion) must explicitly account for rounding remainders in integer paise.

### Consequences
* **Positive:** Complete mathematical determinism; zero rounding drift across millions of transactions; exact checksums between payment sums and ledger balances.
* **Negative / Mitigation:** Developers must remember to multiply by 100 when accepting user input in Rupees. *Mitigation:* Reusable controlled inputs (`CurrencyInput`) that accept Rupees from users but emit integer paise to state and forms.

---

## ADR-006: Dynamic Feature Entitlement Engine vs Static Tiers

### Context & Problem Statement
Different institutes subscribe to different commercial tiers (e.g. Starter, Growth, Enterprise). Furthermore, sales teams need the flexibility to grant specific features (e.g., custom website, biometric attendance integration, multi-branch) as add-ons to specific institutes without creating dozens of rigid subscription plan permutations.

### Decision
We implement a **Two-Tiered Entitlement Engine**:
1. **Plan Baseline:** Every plan defines a set of default features in `plan_features` and a student capacity quota (`student_quota`).
2. **Tenant Overrides:** The table `tenant_entitlements` allows Super Admins to explicitly enable or disable specific features per tenant (`is_enabled: boolean`) with optional expiration dates.

The effective entitlement for any feature is evaluated as:
$$\text{HasFeature}(T, F) = \text{TenantOverride}(T, F) \lor (\text{PlanFeature}(T, F) \land \neg \text{TenantExplicitDeny}(T, F))$$

### Consequences
* **Positive:** Extreme sales flexibility; ability to run limited-time beta tests for specific institutes; instantaneous feature deactivation upon non-payment without disrupting other functions.
* **Negative / Mitigation:** Need for efficient client caching of entitlements. *Mitigation:* Entitlements loaded once on tenant authentication and cached in React context; revalidated on sensitive operations.

---

## ADR-007: Public Institute Website Subdomain Architecture (`<slug>.fixia.in`)

### Context & Problem Statement
Many coaching institutes lack an online presence. Providing an automated marketing website is a major value-add and commercial differentiator for FIXIA EduOS. The architecture must serve these websites without spinning up separate hosting servers or separate repository deployments for each institute.

### Decision
We implement a **Multi-Tenant Subdomain Routing Architecture**:
* Institutes choose a unique URL slug during onboarding (e.g. `apex` for `apex.fixia.in`).
* DNS wildcard `*.fixia.in` points directly to the Vercel edge deployment.
* The frontend router inspects `window.location.hostname`. If a subdomain is detected (excluding `app.fixia.in` and `admin.fixia.in`), the application bypasses the management portal and mounts the Public Website component hierarchy.
* Public components query public database views (`website_pages`, `website_settings`, `courses`) with `security_invoker = true` where `is_published = true`.

### Consequences
* **Positive:** Zero marginal hosting cost per institute website; instant publishing when owner clicks "Publish"; unified maintenance and styling updates across all institute websites.
* **Negative / Mitigation:** Potential SEO cannibalization if slugs are spammy. *Mitigation:* Subdomain slug verification, reserved word list (`www`, `api`, `admin`, `app`, `mail`), and Super Admin suspension capability.

---

## ADR-008: Progressive UI Modernization: Custom CSS Variables to Tailwind CSS & shadcn/ui

### Context & Problem Statement
The current codebase has 170 passing automated tests and a production build operating on an existing custom CSS variables design system (`src/styles/variables.css`, `components.css`). The EduOS blueprint calls for the progressive adoption of Tailwind CSS + shadcn/ui. A destructive, wholesale rewrite of all existing CSS would break passing tests and delay milestones.

### Decision
We adopt a **Progressive Modernization Strategy**:
1. Configure Tailwind CSS and shadcn/ui alongside existing styles in Phase M01/M02.
2. Map Tailwind design tokens (colors, radii, typography) to existing CSS custom properties (`--primary`, `--surface`, `--border`, etc.) to maintain total visual parity.
3. Keep all existing working portal components (`src/pages/owner/`, `src/pages/teacher/`) functioning with their verified class names.
4. Build all new components for EduOS milestones (Super Admin, Setup Wizard, Admission Wizard, Fees Ledger) using modern Tailwind utility classes and accessible shadcn/ui component primitives.
5. Incrementally refactor legacy components during scheduled polish milestones (M13).

### Consequences
* **Positive:** Zero regressions to the 170 existing passing tests; immediately unleashes rapid UI development for new features using standard modern UI libraries; zero downtime.
* **Negative / Mitigation:** Temporary coexistence of utility classes and legacy CSS class names. *Mitigation:* Clear developer guidelines and centralized token mappings.

---

## ADR-009: Strict Zero Service-Role Key Client-Side Exposure & Edge Boundary

### Context & Problem Statement
Supabase provides two database API keys: the `anon` key (public, respects Row-Level Security) and the `service_role` key (secret, bypasses all RLS checks). Accidental leakage of the service-role key in frontend bundles gives any malicious user full, unconstrained administrative control over the entire database across all tenants.

### Decision
The `SUPABASE_SERVICE_ROLE_KEY` MUST NEVER be present in client-side code, Vite environment configurations (`VITE_*`), or public repositories.
* All standard client operations execute through the Supabase client using the authenticated user's JWT and the public `anon` key, subject to PostgreSQL RLS policies.
* Privileged administrative actions (such as generating secure invitation tokens, Super Admin plan reassignments, or automated system maintenance) MUST execute exclusively within **Supabase Edge Functions** or secure server-side environments where the service-role key is loaded as a server secret.
* CI/CD pipelines will execute automated static analysis (Oxlint / regex scanning) preventing any file under `src/` from importing or referencing `SUPABASE_SERVICE_ROLE_KEY` or `SERVICE_ROLE`.

### Consequences
* **Positive:** Absolute protection against tenant data compromise; compliance with Indian digital data protection standards (DPDP Act); impossible for a compromised client token to execute cross-tenant mutations.
* **Negative / Mitigation:** Requires authoring Edge Functions for privileged tasks instead of quick frontend database calls. *Mitigation:* Standardized Edge Function template and local testing harnessing in Supabase CLI.
