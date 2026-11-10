# FIXIA EduOS — Product Requirements Document (PRD)

**Document Version:** 1.0.0  
**Status:** Approved Architecture Baseline  
**Product:** FIXIA EduOS (Education Operating System)  
**Target Market:** Indian Coaching Institutes, Tuition Centres, Computer Institutes, and Skill Academies  
**Author:** Principal Software Architect & Product Lead  

---

## 1. Product Vision & Executive Summary

**FIXIA EduOS** is an all-in-one, multi-tenant education management software-as-a-service (SaaS) platform engineered for Indian education businesses.

Instead of fragmenting the codebase across different verticals, EduOS uses **one configurable, unified application platform** that adapts its terminology, enabled modules, and operational workflows to the specific institute type:
- **School Academic Tuition Centres:** Class 9–12 CBSE/ICSE coaching, homework tracking, board exam prep.
- **Competitive Entrance Academies:** JEE, NEET, CUET, NDA, CLAT coaching, DPPs, mock test rankings.
- **Commerce & Professional Coaching:** CA Foundation, CS, CMA, CPA, tally accounting training.
- **Computer & IT Training Institutes:** DCA, ADCA, Python, Web Development, Typing, Certification.
- **Skill & Language Academies:** Spoken English, IELTS/TOEFL, Graphic Design, Vocational Training.

### Core Value Proposition
An institute owner or director can understand and manage the state of their entire institution (admissions, attendance, fee collections, teacher assignments, exams, and net operating income) in a few minutes from any desktop, tablet, or smartphone without technical training.

The product completely replaces:
- Paper registers and physical roll-call diaries.
- Manual paper receipt books and lost carbon copies.
- Scattered Excel spreadsheets for fees, marks, and student profiles.
- Unorganized WhatsApp chat groups for admissions follow-up.
- Manual calculation of monthly revenue and instructor payroll.

---

## 2. Core User Experiences

EduOS delivers three distinct, isolated application experiences from a single codebase:

```
+---------------------------------------------------------------------------------------------------+
|                                        SHARED REPOSITORY                                          |
|                                    React + TypeScript + Vite                                      |
+---------------------------------------------------------------------------------------------------+
        |                                       |                                       |
        v                                       v                                       v
+-------------------------------+   +-------------------------------+   +-------------------------------+
|      EXPERIENCE 1:            |   |      EXPERIENCE 2:            |   |      EXPERIENCE 3:            |
|   FIXIA SUPER ADMIN           |   |   INSTITUTE OPERATIONS APP    |   |   PUBLIC INSTITUTE WEBSITE    |
|   (/superadmin/*)             |   |   (/, /students, /fees, etc.) |   |   (academy.fixia.in)          |
|                               |   |                               |   |                               |
| * Platform Fleet Governance   |   | * Owner Management Portal     |   | * Public Branding & About     |
| * Tenant Provisioning & Limits|   | * Front-Desk Admissions & Fees|   | * Course Catalog & Batches    |
| * Plan & Quota Entitlements   |   | * Teacher Attendance Terminal |   | * Faculty Profiles            |
| * Model A, B, C Subscriptions |   | * Student & Parent Views      |   | * Lead Capture Enquiry Form   |
| * Platform Audit Trail        |   | * Academic & Financial Reports|   | * WhatsApp Click-to-Chat      |
+-------------------------------+   +-------------------------------+   +-------------------------------+
```

---

## 3. User Journeys & Core Workflows

### Journey A: FIXIA-Managed Institute Onboarding
1. FIXIA Platform Admin logs into `/superadmin`.
2. Admin clicks **"Create Institute"**, enters institute name, owner name, email, phone, city, state, and category.
3. Admin selects or configures a commercial subscription plan (Starter, Growth, Pro, or Custom), sets student/branch limits, and sets trial or activation dates.
4. System creates the `tenants` record and dispatches an invitation link to the owner.
5. Owner clicks the secure token link, sets their permanent password, and enters their onboarding wizard (logo, receipt prefix, academic session, working days).
6. Owner dashboard is activated with features provisioned according to their plan entitlements.

### Journey B: Institute Self-Registration
1. Institute owner visits the public landing page and clicks **"Get Started / Start Free Trial"**.
2. User enters name, mobile number, email, password, institute name, and city.
3. System sends an email verification code (Supabase Auth PKCE).
4. Upon verification, the system executes an idempotent server transaction:
   - Provisions a new `tenants` record.
   - Provisions the user's `profiles` record.
   - Creates the initial `tenant_memberships` record with role `owner`.
   - Creates a default 14-day evaluation `tenant_subscriptions` record with Starter entitlements.
5. User enters the institute setup wizard and lands on their operational dashboard.
*Security Invariant:* Self-registration can never grant platform-tier permissions (`super_admin`) or allow user manipulation of subscription limits.

### Journey C: Daily Institute Operations
1. **Enquiry Received:** Receptionist or website visitor submits a lead enquiry. Front desk logs follow-up dates and status (New -> Contacted -> Interested).
2. **Admission Completed:** Front desk converts enquiry into an official student admission. Student ID is generated (e.g. `FIX-2026-001`). Student is allocated to a Course and Batch.
3. **Fee Plan Assigned:** Fee structure is attached with due dates, payment frequency, and authorized concessions.
4. **Teacher Roll-Call:** Teacher logs into `/teacher` from a mobile device, opens the assigned batch terminal, marks Present/Absent/Late with 48px touch targets, and submits.
5. **Fee Payment Collected:** Student pays tuition via UPI, Cash, Bank Transfer, or Cheque. Receptionist logs payment; system issues an official printable receipt with unique receipt number.
6. **Examination Marks Entered:** Instructor enters marks for weekly tests; system auto-calculates percentages and grades.
7. **Owner Reviews P&L:** Director reviews true Net Operating Income:
   $$\text{Net Operating Income} = \text{Realized Fee Collections} - \text{Recorded Expenses}$$

### Journey D: Commercial Subscription & Lifecycle Management
1. FIXIA controls plans, feature flags, quotas (students, branches, staff), renewals, grace periods, suspension, and reactivation.
2. If an institute's subscription expires:
   - Institute access enters a configurable `grace_period` (e.g. 7 days).
   - If unpaid, institute status transitions to `suspended` (read-only or access blocked with payment notice).
   - *Core Invariant:* **Never delete an institute's data simply because its subscription expires.** Historical records remain preserved.

---

## 4. Detailed Functional Module Requirements

### 4.1 Dashboard
- **Instant Health Metrics:** Total active students, new admissions this month, today's attendance count and rate, monthly realized collections, outstanding fee dues, upcoming exams, active batches.
- **Actionable Owner Alerts:** Low attendance alerts (<75%), high overdue fee defaulters, batch capacity warnings (>90% full).
- **Today's Classes & Timetable:** Live schedule showing batch, timings, room, instructor, and attendance submission pill.
- **Role Scoping:** Metrics automatically scoped to the logged-in user's role and assigned branch.

### 4.2 Admissions & Lead Enquiries
- **Lead Capture:** Full name, phone, email, interested course, lead source (Walk-in, Reference, Social Media, Website, Flyer).
- **Follow-up Engine:** Assigned staff counselor, next follow-up date, conversation logs, lead status (`new`, `contacted`, `interested`, `converted`, `lost`).
- **One-Click Admission Conversion:** Converts lead directly into student record without duplicate data entry. Prevents accidental duplicate conversions.

### 4.3 Student Management
- **Student Profile:** Student ID, Full name, DOB, Gender, Phone, Email, Address, Admission Date, Avatar/Photo.
- **Guardian Details:** Father/Mother/Guardian name, relation, phone, occupation.
- **Academic Mapping:** Linked course, active batch, roll number.
- **Batch Transfer Engine:** Allows transferring a student to a new batch with mandatory reason and preserves historical attendance continuity.
- **Document Locker:** Storage of Aadhaar, prior marksheets, and registration forms.
- **Archiving & Recovery:** Soft-deletion (`archived` status) with full restoration capability.

### 4.4 Courses, Subjects & Batches
- **Courses:** Name, category, duration, description, default fee, active status.
- **Subjects:** Multi-subject mapping per course (e.g. Physics, Chemistry, Maths).
- **Batches:** Batch code, name, course, branch, room number, schedule days, timing, maximum seat capacity, assigned primary faculty.
- **Capacity Management:** Visual seat utilization bar (`enrolled / capacity`) with over-capacity warnings.

### 4.5 Weekly Timetable & Classroom Allocation
- **Weekly Schedule Grid:** Monday through Saturday lecture scheduling.
- **Automated Collision Guard:** Detects and blocks room double-booking and teacher schedule clashes on overlapping timeslots.
- **Classroom Allocation:** Room capacity tracking and utilization.

### 4.6 Attendance Engine
- **Statuses:** Present (`present`), Absent (`absent`), Late (`late`), Leave (`leave`).
- **Batch-Wise Roll-Call:** Rapid terminal with live counters and "Mark All Present" toggle.
- **Teacher Assignment Guard:** Teachers can only take attendance for batches assigned to them.
- **Owner-Authorized Corrections:** Edits after 24 hours require mandatory administrative justification and are logged to `audit_logs`.
- **Analytics:** Monthly attendance percentages, low-attendance alerts (<75%).

### 4.7 Fees & Financial Ledger
- **Integer Paise Standard:** All monetary amounts stored as integer paise (e.g. ₹1,499 = 149,900 paise) to prevent IEEE-754 floating-point rounding errors.
- **Fee Plans:** Flexible billing cycles (Monthly, Quarterly, Annual, Full Course, Custom).
- **Installment Ledger:** Automatic calculation of invoiced amount, paid amount, and outstanding balance.
- **Payment Modes:** Cash, UPI (with UTR reference), Bank Transfer (NEFT/IMPS), Cheque (with bank & cheque number), Card.
- **Official Receipts:** Professional Indian coaching receipt format with student details, batch, tax exemption disclaimers, and currency in words.
- **Non-Destructive Reversals:** Payment records are immutable financial events. Reversals never delete records; they set `status = 'reversed'`, log the acting owner, reason, and restore student balance.

### 4.8 Institute Expense Management
- **Outflow Vouchers:** Rent, teacher salaries, electricity/utilities, stationery/DPPs printing, marketing/ad campaigns, maintenance, software.
- **Payment Details:** Amount, recipient, payment mode, reference number, expense date.
- **Non-Destructive Voiding:** Vouchers can be voided with mandatory administrative justification.
- **True Net Operating Income:** Realized fee collections minus non-voided expenses.

### 4.9 Examinations & Marks
- **Exam Creation:** Exam title, academic session, course, assigned batches, date.
- **Subject Grading:** Maximum marks, passing marks, marks entered per student.
- **Calculation Engine:** Automatic percentage, percentile, and letter grade calculation.
- **Publishing Guard:** Results remain private to administrators until explicitly published.

### 4.10 Staff & Faculty Management
- **Staff Profiles:** Name, email, mobile, role title, specialization subjects, joining date.
- **Batch Assignment:** Direct linking of instructors to authorized cohorts.
- **Self-Deactivation Guard:** Prevents institute owners from locking themselves out or deactivating the primary account.

### 4.11 Communication & In-App Notifications
- **In-App Notification Center:** Automated alerts for fee dues, overdue arrears, low attendance, and system updates.
- **Institute Announcements:** Broadcast notices to staff, faculty, or all members.
- **Manual WhatsApp Links:** Pre-formatted click-to-chat links for fee reminders and attendance alerts without external API costs.
*Rule:* Automated third-party WhatsApp API integration is deferred until provider credentials and templates are approved.

### 4.12 Optional Public Institute Website
- **Entitlement Gated:** Active only for institutes whose subscription plan includes `public_website = true`.
- **Subdomain Routing:** Accessible via `slug.fixia.in` or custom domain.
- **Public Showcase:** Institute branding, logo, about us, courses offered, faculty bios, branch addresses, lead enquiry form, WhatsApp chat button.
*Security Invariant:* Public website queries can never expose student records, internal ledgers, or unpublished exam results.

---

## 5. Non-Functional Requirements & Performance SLAs

- **Page Load Time:** Initial load under 1.5 seconds on 4G mobile connections.
- **Bundle Optimization:** Total gzipped JavaScript under 450 kB with route-level code splitting.
- **Data Isolation:** Zero cross-tenant data leakage guaranteed at database kernel level via PostgreSQL RLS.
- **Availability:** 99.9% uptime SLA for Supabase and Vercel edge deployment.
- **Offline Shell:** Installable Progressive Web App (PWA) with cached static assets and clear offline indicator.
