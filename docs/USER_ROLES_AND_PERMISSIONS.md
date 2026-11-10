# FIXIA EduOS — Role Taxonomy & Permission Authority Matrix

**Document Version:** 1.0.0  
**Status:** Approved Role-Based Access Control (RBAC) Specification  
**Architecture:** Two-Tier Authority Model (Platform Tier vs. Institute Tier)  
**Author:** Principal Security Architect & Lead Engineer  

---

## 1. Role Taxonomy & Authority Hierarchy

FIXIA EduOS separates privileges into two completely decoupled administrative tiers:
1. **Platform-Level Roles (FIXIA Governance):** Governs SaaS subscriptions, commercial limits, and tenant health across all institutes.
2. **Institute-Level Roles (Tenant Operations):** Governs academic, operational, and financial workflows within an individual institute workspace.

```
+=========================================================================================+
|                                    PLATFORM TIER (FIXIA)                                |
|                                                                                         |
|  * Super Admin:      Universal platform command, billing models, database administration |
|  * Platform Admin:   Tenant lifecycle management, subscriptions, quotas, and support    |
|  * Billing Admin:    Platform pricing plans, invoices, and payment gateways             |
|  * Support Agent:    Audited, temporary read-only support assistance for troubleshooting |
+=========================================================================================+
                                            ||
                                            \/
+=========================================================================================+
|                                  INSTITUTE TIER (TENANT)                                |
|                                                                                         |
|  * Owner:            Full director authority over institute, settings, and finances     |
|  * Institute Admin:  Daily operational administration across all branches and modules   |
|  * Branch Manager:   Operations restricted strictly to their assigned branch location    |
|  * Accountant:       Fees, installment tracking, payments, expense vouchers, receipts   |
|  * Receptionist:     Enquiry leads, follow-ups, student admissions, and basic profiles  |
|  * Teacher:          Assigned batch rosters, roll-call attendance, and exam marks       |
|  * Student:          Personal academic timetable, attendance history, and report cards  |
|  * Parent/Guardian:  Linked ward's attendance alerts, fee dues, and academic reports    |
+=========================================================================================+
```

---

## 2. Multi-Institute Membership Model

In FIXIA EduOS, a user account (`profiles.id` = `auth.users.id`) is **independent of any specific institute**. A user can hold active memberships in multiple coaching institutes simultaneously, with distinct roles in each:

```
                                  [ User: Dr. Rajesh Kumar ]
                                      (Email: rajesh@edu.in)
                                                |
               +--------------------------------+--------------------------------+
               |                                                                 |
               v                                                                 v
+-------------------------------+                               +-------------------------------+
|    INSTITUTE A: KASHI JEE     |                               |   INSTITUTE B: VARANASI CA    |
|  - Role: Owner                |                               |  - Role: Teacher (Economics)  |
|  - Full Administrative Access |                               |  - Assigned Batches Only      |
|  - Full Financial Access      |                               |  - Zero Financial Access      |
+-------------------------------+                               +-------------------------------+
```

When Dr. Rajesh logs in, the application prompts him to choose his active workspace (or switches via a tenant dropdown). All subsequent queries pass his active `tenant_id` to PostgreSQL Row Level Security.

---

## 3. Comprehensive Granular Permission Matrix

| Module & Operation | Super Admin | Owner | Inst. Admin | Branch Mgr | Accountant | Receptionist | Teacher | Student / Parent |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Platform Fleet Dashboard** | **FULL** | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked |
| **Manage Subscriptions & Quotas**| **FULL** | ❌ Read Only | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked |
| **Issue Perpetual Licenses (Model B)**| **FULL**| ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked |
| **Platform Audit Logs** | **FULL** | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked |
| **Institute Dashboard** | Diagnostic | **FULL** | **FULL** | Branch Only| Financial | Front Desk | Assigned | Personal |
| **Admissions & Enquiries** | Diagnostic | **FULL** | **FULL** | Branch Only| ❌ Blocked | **FULL** | ❌ Blocked | ❌ Blocked |
| **Student Profiles & PII** | Diagnostic | **FULL** | **FULL** | Branch Only| Read Only | Create/Edit | Assigned Only| Self Only |
| **Batch Transfers** | ❌ Blocked | **FULL** | **FULL** | Branch Only| ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked |
| **Courses & Subjects** | ❌ Blocked | **FULL** | **FULL** | Read Only | Read Only | Read Only | Read Only | Read Only |
| **Batches & Timetable** | ❌ Blocked | **FULL** | **FULL** | Branch Only| Read Only | Read Only | View Assigned| View Assigned|
| **Take Roll-Call Attendance** | ❌ Blocked | **FULL** | **FULL** | Branch Only| ❌ Blocked | ❌ Blocked | **Assigned Only**| ❌ Blocked |
| **Correct Attendance (>24h)** | ❌ Blocked | **FULL** | **FULL** | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked |
| **View Attendance Reports** | Diagnostic | **FULL** | **FULL** | Branch Only| ❌ Blocked | ❌ Blocked | Assigned Only| Self Only |
| **Configure Fee Plans** | ❌ Blocked | **FULL** | **FULL** | ❌ Blocked | Read Only | ❌ Blocked | ❌ Blocked | ❌ Blocked |
| **Record Tuition Payments** | ❌ Blocked | **FULL** | **FULL** | Branch Only| **FULL** | Limited | ❌ Blocked | ❌ Blocked |
| **Print Official Receipts** | ❌ Blocked | **FULL** | **FULL** | Branch Only| **FULL** | **FULL** | ❌ Blocked | View Self |
| **Reverse Payments** | ❌ Blocked | **FULL** | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked |
| **Record Expenses & Vouchers** | ❌ Blocked | **FULL** | **FULL** | Branch Only| **FULL** | ❌ Blocked | ❌ Blocked | ❌ Blocked |
| **Void Expenses** | ❌ Blocked | **FULL** | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked |
| **View Net Operating Income** | ❌ Blocked | **FULL** | **FULL** | Branch Only| Financial | ❌ Blocked | ❌ Blocked | ❌ Blocked |
| **Create & Grade Examinations**| ❌ Blocked | **FULL** | **FULL** | Branch Only| ❌ Blocked | ❌ Blocked | Assigned Only| ❌ Blocked |
| **Publish Exam Results** | ❌ Blocked | **FULL** | **FULL** | Branch Only| ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked |
| **Manage Staff & Permissions** | ❌ Blocked | **FULL** | **FULL** | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked |
| **Institute Branding & Settings**| ❌ Blocked | **FULL** | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked |
| **Public Website Publishing** | Diagnostic | **FULL** | **FULL** | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked |

---

## 4. Specific Role Constraints & Invariants

1. **Owner Immutability:** An institute must always possess at least one active Owner. The owner cannot accidentally remove their own administrative access or delete the institute without an explicit multi-step confirmation.
2. **Teacher Financial Isolation:** Teachers are strictly restricted to academic operations for their assigned batches. Under no circumstances can a teacher access fee collection, student fee balances, expenses, owner dashboard metrics, or institute settings.
3. **Accountant Scope:** Accountants can record and allocate student fee payments, generate official receipts, and record expense vouchers, but **cannot reverse payments** or modify institute settings. Reversals require Owner authorization.
4. **Branch Isolation:** A user assigned as a `Branch Manager` can only inspect students, attendance, batches, and collections within their explicitly assigned `branch_id`. Multi-branch institutes are partitioned cleanly.
5. **Parent / Student Boundary:** Students and parents authenticate via phone/email and receive access strictly to their own academic timetable, attendance percentage, fee balance, and published report cards. Cross-student inspection is blocked at the database kernel level.
