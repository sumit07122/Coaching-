# FIXIA CoachingOS — Multi-Tenant Institute Management SaaS

> **Enterprise-Grade SaaS for Indian Coaching Institutes (< 100 Students initially)**  
> Built with React 19 + TypeScript + Vite + Supabase Architecture + Recharts + React Hook Form + Zod  
> **Strict Rule Enforced:** NO Tailwind CSS. Clean, responsive design system built entirely in modular regular CSS.

---

## 🚀 Quick Start Instructions

### Prerequisites
- Node.js (v18+ recommended, tested on Node v26)
- npm (v9+)

### Installation & Run
```bash
# 1. Install dependencies
npm install

# 2. Run the interactive application
npm run dev

# 3. Access in your browser:
# http://localhost:5173/
```

### Run Unit Tests
```bash
# Run Vitest test suite verifying critical invariant calculations
npm test
```

### Production Build & Preview
```bash
npm run build
npm run preview
```

---

## 🛠️ Technology Stack & Architecture

- **Frontend Core:** React 19, TypeScript (Strict Mode), Vite 8 with route-based dynamic code-splitting and vendor chunk optimization (zero chunk warnings, initial bundle under 102 kB)
- **Styling & Design System:** Regular CSS with custom CSS tokens (Variables, Global Reset, Layout, Modular Components). **Zero Tailwind CSS.**
- **Routing:** React Router v7 (`react-router-dom`) with `React.lazy` and `Suspense` fallbacks
- **Forms & Validation:** `react-hook-form` + `zod` + `@hookform/resolvers`
- **Visual Analytics:** `recharts` (Isolated in async chart chunks for minimal initial page load)
- **Icons:** `lucide-react`
- **Backend Ready:** Supabase Client (`@supabase/supabase-js`), Supabase Auth, PostgreSQL Multi-Tenant schema with Row-Level Security (`supabase/schema.sql` and migrations 1-5)
- **Deployment Ready:** Vercel configuration (`vercel.json`) with SPA rewrite rules, immutable asset headers, and strict security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`)
- **Testing:** `vitest` unit test suite covering critical financial, attendance, security, and production-readiness invariants

---

## 📊 Preloaded Realistic Demo Dataset

The application boots with realistic fictional records based on **Radha Krishna Academy, Mathura**:

| Metric | Target | Implemented Value | Verification |
| :--- | :--- | :--- | :---: |
| **Total Students** | **85** | **85** enrolled across 6 cohorts | Passed (`vitest`) |
| **Active Batches** | **6** | **6** active batches | Passed (`vitest`) |
| **Students Present Today** | **72** | **72** students marked present | Passed (`vitest`) |
| **Students Absent Today** | **13** | **13** students marked absent | Passed (`vitest`) |
| **Collected This Month** | **₹32,000** | **₹32,000** collected across UPI & Cash | Passed (`vitest`) |
| **Pending Fees Dues** | **₹18,500** | **₹18,500** across 20 partial/overdue accounts | Passed (`vitest`) |

---

## 📱 Implemented Screens & Feature Modules

1. **Login & Persona Switcher (`/login`)**: Director/Owner, Front-Desk Admin, and Faculty entry profiles.
2. **Dashboard (`/`)**: Everyday operational command center driven by 100% dynamic institute data:
   - **6 Dynamic KPI Stat Cards**: Total active students (with batch breakdown and seat fill rate %), active batches (with total capacity), today's attendance (present count and punctuality rate %), students absent today (absentee list count), monthly collection (sum of confirmed, non-reversed payments in current month), and pending fee dues (total balance across active students).
   - **Upcoming & Overdue Fee Dues Watchlist**: Real-time list of students with outstanding dues, highlighted overdue tags, due dates, and 1-click **"Collect"** payment recording triggers.
   - **Recent Payments Register**: Latest confirmed payment transactions with student name, batch, payment method badges, date, and 1-click official voucher preview.
   - **Live Recent Activity Feed**: Real-time event stream generated dynamically from institute `auditLogs` (payment receipts, reversals, daily roll submissions, new student enrollments, fee plan assignments, and institute announcements).
   - **Recharts Dynamic Visual Analytics**: Weekly 7-day attendance trend area chart and 5-month fee collection vs target bar chart.
3. **Students (`/students`)**: Search across name/ID/phone/guardian, filter by batch, fee status, and enrollment status (active/archived), pagination, "Add Student" modal with optional email and address, "Edit Student" modal, student archive/restore, deletion, and working **"Export CSV"** file generator. Role permissions enforce read-only access for staff/faculty.
4. **Student Profile (`/students/:id`)**: Comprehensive 360-degree record with attendance score, enrollment status badge, email, residential address, academic batch details, complete financial ledger, payment history, and instant WhatsApp reminder generator.
5. **Batches (`/batches`)**: Cohort cards with timings, schedule days, capacity progress bars, "Create Batch" modal, "Edit Batch" modal, teacher assignment dropdown linked to staff directory, student roster modal with "Remove from batch" capability, and cohort student transfer/assignment.
6. **Attendance (`/attendance`)**: Complete attendance module featuring:
   - **Daily Register Terminal**: Batch selector, date picker, session notes, enrolled active students, interactive 3-way toggle per student (`[ Present ] [ Late ] [ Absent ]`), remarks/notes per student, 1-click "Mark All Present", and "Save Attendance" with duplicate session prevention.
   - **Duplicate Session Prevention**: System enforces unique sessions per `(institute_id, batch_id, session_date)` and unique student attendance records per date; editing an existing session updates the session audit trail without inserting duplicates.
   - **Audit History**: Records who marked and modified attendance (`markedByUserName`, `updatedByUserName`, `updatedAt`).
   - **5 Attendance Reports**:
     - *Daily Attendance Roll*: Comprehensive summary of all cohorts for the selected date.
     - *Batch-wise Attendance*: Average attendance percentages, total sessions, and progress bars.
     - *Student-wise Attendance*: Searchable directory of student punctuality with optimal/satisfactory/defaulter (<75%) badges.
     - *Monthly Attendance Summary*: High-level lectures conducted and overall attendance rates.
     - *Absent Student Watchlist*: Daily absent student list with 1-click parent **"WhatsApp Absence Notice"** copy button.
7. **Fees & Receipts (`/fees`)**: Complete financial terminal featuring:
   - **Student Fee Ledger Tab**: Searchable directory of student dues with filter by cohort and payment standing (`Paid`, `Partial`, `Overdue`), displaying Invoiced, Paid, Balance Due, Fee Plan, and Next Due Date, with 1-click "Collect Payment" and "Assign Plan" actions.
   - **Payment Transactions Tab**: Multi-criteria filterable transaction register (search student/receipt, mode, confirmation/reversal status, date range filter), printable voucher view, and auditable payment reversal controls.
   - **Institute Fee Plans Tab**: Card grid displaying Monthly, Quarterly, Annual, and Custom fee packages, with "Create New Fee Plan" and "Assign Fee Plan & Authorize Concession" modal flows.
   - **Financial Insights & Dues Watchlist**: Payment channel distribution (UPI vs Cash vs Bank Transfer vs Cheque) and cohort collection efficiency metrics.
8. **Payment Receipt Preview**: Official Indian coaching institut0l0o9h7tytre receipt with number-to-words currency formatting (*"Rupees Three Thousand Five Hundred Only"*), `@media print` clean voucher printing, and WhatsApp text copy.
9. **Reports & Exports (`/reports`)**: Complete institute reporting terminal with 5 dedicated reports, universal date range filters (`startDate`, `endDate`), quick date presets (*Today*, *This Week*, *This Month*, *Last Month*, *All Time*), and working **"Export Active Report (CSV)"**:
   - **Student Report**: Demographic, batch, course, admission date, and fee ledger status.
   - **Attendance Report**: Roll records with student codes, names, attendance status, remarks, and marking faculty.
   - **Fee Collection Report**: Financial register with receipt numbers, payment methods, transaction amounts, remaining balances, and collectors.
   - **Pending Fee Report**: Defaulters directory with guardian phone numbers, invoice totals, paid amounts, outstanding balances, and due dates.
   - **Batch Report**: Cohort capacity, enrollment counts, seat fill rates %, monthly rates, and collection efficiencies %.
10. **Notification & Announcement Center**: Comprehensive communications modal and header bell dropdown:
   - Categorized updates: *Upcoming Fee Dues*, *Overdue Fees Alert*, *Institute Announcements*, and *Attendance Reports*.
   - Read/unread status indicators, "Mark All as Read", individual read toggles, and notification dismissal.
   - Owner/Admin **"Broadcast Announcement"** tool allowing instant broadcast of academic notices with priority flags to staff and dashboard.
11. **Staff & Faculty (`/staff`)**: Dedicated staff directory, role badges (`Owner`, `Admin`, `Faculty`), active/inactive status toggle, assigned batch chips, and "Add Staff Member" modal with **React Hook Form + Zod** schema validation. Protected against accidental owner deletion.
12. **Institute Settings (`/settings`)**: Coaching archetype picker (K-12, JEE/NEET, Commerce, Skills), institute profile, WhatsApp template customization, and "Reset Demo Data" control.

---

## 🔒 Multi-Tenant Database Architecture (`supabase/schema.sql`)

The PostgreSQL schema is located in [`supabase/schema.sql`](file:///c:/Users/hp/OneDrive/Desktop/antigravity%20workspace/Coaching%20Saas/supabase/schema.sql) and versioned under `supabase/migrations/`:
- `20261103000001_core_schema.sql`: Core multi-tenant relational schema (`institutes`, `profiles`, `memberships`, `batches`, `students`, `attendance_sessions`, `attendance_records`, `fee_plans`, `payments`, `audit_logs`, `commercial_subscriptions`).
- `20261103000002_multi_tenant_rls.sql`: Row-Level Security (RLS) policies enforcing complete tenant boundary isolation and role barriers.
- `20261103000003_auth_onboarding_and_security.sql`: User profile creation trigger on `auth.users`, transactional `onboard_institute` RPC function (`SECURITY DEFINER`), and profile synchronization.
- `20261103000004_storage_and_security_hardening.sql`: Multi-tenant Supabase Storage RLS policies on `storage.objects` (`receipts`, `documents`, `avatars`) and database server-level `prevent_cross_tenant_mutation` triggers.
- `20261103000005_commercial_configuration.sql`: Commercial multi-model configuration schema, 7-dimension state separation, `chk_no_source_code_ownership` constraint, `trg_check_student_quota` database trigger enforcing admissions limits, and `check_module_entitlement` server-side stored procedure.

---

## 🧪 Testing Verification

```bash
npm test
```
Outputs:
```
Test Files  9 passed (9)
     Tests  119 passed (119)
  Duration  542ms
```
All 119 unit tests pass across 9 test suites:
- **`production-readiness.test.ts` (12 tests)**: Verifies complete production-readiness: frontend service-role key interception and neutralization, mandatory tenant attribution across all records, storage bucket folder isolation (`/{instituteId}/{subfolder}/{file}`), RBAC permission barriers across Owner/Admin/Staff, database check constraint enforcing `sourceCodeOwnership: false`, invariant student/batch/attendance/collection metrics, invoicing separation from payment, payment balance reduction arithmetic, payment reversal balance restoration, pagination slicing and boundary edge cases, empty state filter returns, and Indian number-to-words currency formatting.
- **`dashboard-reports-notifications.test.ts` (20 tests)**: Verifies dynamic dashboard metrics computed from live institute data (active students count, active batches, attendance counts & rates, monthly collections excluding reversals, pending fee balances), upcoming and overdue dues extraction, dynamic activity feed generation from `auditLogs`, five distinct report datasets (Student, Attendance, Collections, Pending Dues, Batch Capacity), multi-criteria date filtering, CSV generation and escaping, notifications lifecycle (upcoming dues, overdue notices, announcements broadcast, read/unread states, dismissals), and strict multi-tenant boundary isolation.
- **`fee-management.test.ts` (24 tests)**: Verifies fee plan creation (monthly, quarterly, annual, custom structures), invalid plan rejection (negative/zero/NaN amounts, blank names), student plan assignment, authorized discount concession calculation (`netInvoiced = plan.amount - discount`), enforcement of invoicing separation (assigning plan never counts as payment), manual partial and full payment recording, student ledger updates (`totalFeeInvoiced`, `totalFeePaid`, `balanceFee`), unique receipt numbering (`RCP-2026-XXXX`), duplicate payment prevention (3-second debounce window), negative/zero payment rejection, auditable payment reversals with mandatory reason and ledger balance restoration, double-reversal prevention, Owner/Admin authorization barriers (blocks staff/faculty), tenant isolation (`instituteId: 'INST-MTH-01'`), and aggregate metrics (November ₹32,000 collection, ₹18,500 pending dues, defaulters watchlist).
- **`attendance-module.test.ts` (12 tests)**: Verifies exact baseline calculations (72 present, 13 absent, 85% rate), batch-wise attendance percentages, absentee list extraction, student attendance summaries, session duplicate prevention (updates existing session), student record deduplication, role authorization barriers (rejects unauthorized users), multi-tenant `instituteId` attribution, student batch membership validation, date format checks, and audit tracking of marking/editing staff.
- **`crud-modules.test.ts` (15 tests)**: Verifies student admissions (with email & address), update, profile retrieval, archive/restore lifecycle, delete, CSV export escaping, batch creation, teacher assignment from staff directory, student batch transfer/assign, student removal from batch, staff onboarding, active/inactive toggle, owner protection, and Owner/Admin/Staff permission barriers.
- **`tenant-isolation.test.ts` (6 tests)**: Verifies multi-tenant isolation, cross-tenant mutation blocks, storage file isolation, role permission barriers, and unauthenticated rejections.
- **`supabase-auth.test.ts` (10 tests)**: Verifies service-role key exclusion, public anon key safety, Owner/Admin/Staff permission matrices, institute onboarding validation, and email/password reset validation.
- **`calculations.test.ts` (7 tests)**: Verifies student counts (85), batch capacity sums (85), attendance status counts (72 present, 13 absent), monthly collections (₹32,000), and partial payment ledger balance adjustments.
- **`commercial-licensing.test.ts` (13 tests)**: Verifies complete commercial operations: Model A (SaaS) setup fees, recurring cycles, renewal dates, support tiers, and student quota admission blocking; Model B (One-time licence) purchase fees, cryptographic licence keys, software version locking, AMC maintenance responsibility, client hosting, and mandatory IP non-transfer constraints (`sourceCodeOwnership: false` and no lifetime hosting or support promises); Model C (Custom development) bespoke requirements, formal quotation tracking, milestone lifecycle stages (`discovery` -> `in_development` -> `testing` -> `delivered` -> `accepted`), delivery notes, and support agreements; strict separation of the 7 commercial dimensions; server-side stored procedure module entitlement checks (`check_module_entitlement`); and single unified codebase architecture without code forks.

---

## 📚 Complete Project Documentation

Detailed architecture specifications and deployment guides are located in `/docs`:
- [`docs/SUPABASE_SETUP.md`](file:///c:/Users/hp/OneDrive/Desktop/antigravity%20workspace/Coaching%20Saas/docs/SUPABASE_SETUP.md): Production Supabase setup, migrations execution, auth configuration, and security rules.
- [`docs/PRD.md`](file:///c:/Users/hp/OneDrive/Desktop/antigravity%20workspace/Coaching%20Saas/docs/PRD.md): Comprehensive Product Requirements Document.
- [`docs/ARCHITECTURE.md`](file:///c:/Users/hp/OneDrive/Desktop/antigravity%20workspace/Coaching%20Saas/docs/ARCHITECTURE.md): Multi-tenant architecture, PostgreSQL RLS policies, RBAC matrix, and commercial models.
- [`docs/DEPLOYMENT.md`](file:///c:/Users/hp/OneDrive/Desktop/antigravity%20workspace/Coaching%20Saas/docs/DEPLOYMENT.md): Production deployment guide for Vercel + Supabase Cloud.
- [`docs/SECURITY_AUDIT.md`](file:///c:/Users/hp/OneDrive/Desktop/antigravity%20workspace/Coaching%20Saas/docs/SECURITY_AUDIT.md): Security audit report on RLS policies, role barriers, and audit trail safeguards.
- [`docs/TESTING_CHECKLIST.md`](file:///c:/Users/hp/OneDrive/Desktop/antigravity%20workspace/Coaching%20Saas/docs/TESTING_CHECKLIST.md): Step-by-step manual and automated verification checklist.
