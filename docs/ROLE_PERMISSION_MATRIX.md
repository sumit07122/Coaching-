# FIXIA CoachingOS — Role & Permission Authority Matrix
**Document Version:** 1.0.0  
**Phase:** 11 — Architecture & System Audit  
**Author:** Senior SaaS Product Architect & Security Engineer  
**Status:** Approved Security Matrix  

---

## 1. Role Taxonomy & Authority Hierarchy

FIXIA CoachingOS defines four distinct user personas across two tiers (Tenant Tier vs. Platform Tier):

```
+-------------------------------------------------------------------------+
|                          PLATFORM TIER                                  |
|   FIXIA Super Admin (super_admin)                                       |
|   Platform Governance, Tenant Lifecycle, Commercial Licenses & Quotas    |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                          TENANT TIER                                    |
|                                                                         |
|   +-----------------------------------------------------------------+   |
|   | 1. Institute Owner (owner)                                      |   |
|   |    Sole Director / Founder Authority. Full Tenant Command.      |   |
|   +-----------------------------------------------------------------+   |
|                                    |                                    |
|                                    v                                    |
|   +-----------------------------------------------------------------+   |
|   | 2. Operations Admin (admin)                                     |   |
|   |    Front Desk / Center Manager. Admissions, Fees, Scheduling.   |   |
|   +-----------------------------------------------------------------+   |
|                                    |                                    |
|                                    v                                    |
|   +-----------------------------------------------------------------+   |
|   | 3. Teacher / Faculty (teacher / faculty / staff)                |   |
|   |    Classroom Instructor. Restricted Attendance & Schedules Only.|   |
|   +-----------------------------------------------------------------+   |
+-------------------------------------------------------------------------+
```

---

## 2. Complete Functional Feature Matrix

| Feature / Capability | Institute Owner | Operations Admin | Teacher / Faculty | Platform Super Admin |
| :--- | :---: | :---: | :---: | :---: |
| **Executive Owner Dashboard** | Full Access | Full Access | **BLOCKED** | Platform Aggregate |
| **Teacher Class Overview** | View All | View All | **Assigned Classes Only** | N/A |
| **Student Admissions** | Full CRUD | Full CRUD | **BLOCKED** | N/A |
| **Student Profiles & PII** | Full CRUD | Full CRUD | **Roster Only (Name & ID)** | N/A |
| **Student Batch Transfer** | Full Access | Full Access | **BLOCKED** | N/A |
| **Student Soft Archiving** | Full Access | Full Access | **BLOCKED** | N/A |
| **Batch Creation & Editing** | Full CRUD | Full CRUD | **BLOCKED** | N/A |
| **Batch Roster Inspection** | All Batches | All Batches | **Assigned Batches Only** | N/A |
| **Classroom & Timetable Setup**| Full CRUD | Full CRUD | View Assigned | N/A |
| **Mark Class Attendance** | Any Batch | Any Batch | **Assigned Batches Only** | N/A |
| **Edit Saved Attendance** | Any Batch | Any Batch | **Own Sessions Only (24h)**| N/A |
| **Historical Attendance Sheets**| All Batches | All Batches | **Assigned Batches Only** | N/A |
| **Fee Structure Configuration** | Full CRUD | Full CRUD | **BLOCKED** | N/A |
| **Collect & Record Payments** | Full Access | Full Access | **BLOCKED** | N/A |
| **Print Official Receipts** | Full Access | Full Access | **BLOCKED** | N/A |
| **Payment Reversals** | **AUTHORIZED** | **BLOCKED** | **BLOCKED** | N/A |
| **Record Institute Expenses** | Full Access | Full Access | **BLOCKED** | N/A |
| **Approve / Delete Expenses** | **AUTHORIZED** | **BLOCKED** | **BLOCKED** | N/A |
| **Staff Account Provisioning** | Full CRUD | Create Teachers Only| **BLOCKED** | N/A |
| **Assign Teachers to Batches** | Full Access | Full Access | **BLOCKED** | N/A |
| **Institute Branding & Settings**| **AUTHORIZED**| **BLOCKED** | **BLOCKED** | N/A |
| **Commercial Quotas & Plans** | View Only | View Only | **BLOCKED** | **FULL CONTROL** |
| **Audit Log Inspection** | **AUTHORIZED** | **BLOCKED** | **BLOCKED** | Platform Logs |

---

## 3. Database Row Level Security (RLS) Policy Matrix

Permissions must be enforced at the PostgreSQL database kernel level, not merely obscured on the frontend:

| PostgreSQL Table | Institute Owner | Operations Admin | Teacher / Faculty | Platform Super Admin |
| :--- | :--- | :--- | :--- | :--- |
| `institutes` | `SELECT`, `UPDATE` | `SELECT` | `SELECT` | Full CRUD |
| `profiles` | `SELECT`, `UPDATE` (Self & Institute) | `SELECT`, `UPDATE` (Self & Institute) | `SELECT` (Self & Peers), `UPDATE` (Self) | Full CRUD |
| `memberships` | Full CRUD | `SELECT`, `INSERT`, `UPDATE` (Staff only) | `SELECT` (Self only) | Full CRUD |
| `courses` | Full CRUD | Full CRUD | `SELECT` | Full CRUD |
| `batches` | Full CRUD | Full CRUD | `SELECT` (Assigned Batches Only) | Full CRUD |
| `batch_schedules` | Full CRUD | Full CRUD | `SELECT` (Assigned Batches Only) | Full CRUD |
| `students` | Full CRUD | Full CRUD | `SELECT` (Assigned Cohorts Only) | Full CRUD |
| `batch_enrollment_history` | Full CRUD | Full CRUD | `SELECT` (Assigned Batches Only) | Full CRUD |
| `attendance_sessions` | Full CRUD | Full CRUD | `SELECT`, `INSERT`, `UPDATE` (Assigned Batches Only) | Full CRUD |
| `attendance_records` | Full CRUD | Full CRUD | `SELECT`, `INSERT`, `UPDATE` (Assigned Batches Only) | Full CRUD |
| `fee_plans` | Full CRUD | Full CRUD | **NO PERMISSIONS (0 Rows Returned)** | Full CRUD |
| `payments` | Full CRUD (Reversal Owner Only) | `SELECT`, `INSERT` (No Reversals) | **NO PERMISSIONS (0 Rows Returned)** | Full CRUD |
| `expenses` | Full CRUD | `SELECT`, `INSERT` | **NO PERMISSIONS (0 Rows Returned)** | Full CRUD |
| `audit_logs` | `SELECT` (All Actions) | `INSERT` (System Log only) | `INSERT` (System Log only) | Full CRUD |
| `commercial_subscriptions` | `SELECT` (Own Subscription) | `SELECT` (Own Subscription) | **NO PERMISSIONS (0 Rows Returned)** | Full CRUD |

---

## 4. UI Navigation & Portal Segmentation

### Portal 1: Institute Owner Management Portal (`/owner/*`)
Visible to users with `role = 'owner'` or `role = 'admin'`:

```
[FIXIA CoachingOS — Owner Portal]
├── Overview & Analytics
│   └── Dashboard (/owner)
├── Academic Operations
│   ├── Students & Admissions (/owner/students)
│   ├── Batches & Courses (/owner/batches)
│   ├── Timetables & Schedules (/owner/timetables)
│   └── Attendance Center (/owner/attendance)
├── Finance & Ledger
│   ├── Fee Plans & Structure (/owner/fees)
│   ├── Payments & Receipts (/owner/fees/payments)
│   └── Institute Expenses (/owner/expenses)
├── Team & Governance
│   ├── Faculty & Staff Accounts (/owner/staff)
│   ├── Reports & Exports (/owner/reports)
│   ├── Audit Logs (/owner/settings?tab=audit) [Owner Only]
│   └── Institute Settings (/owner/settings) [Owner Only]
```

### Portal 2: Teacher Class Attendance Portal (`/teacher/*`)
Visible to users with `role = 'teacher'`, `role = 'faculty'`, or `role = 'staff'`:

```
[FIXIA CoachingOS — Teacher Portal]
├── Class Routine
│   └── Today's Lectures & Overview (/teacher)
├── Attendance Terminal
│   └── Roll-Call Terminal (/teacher/attendance/:batchId)
└── Records
    └── Attendance History & Reports (/teacher/history)
```

> [!IMPORTANT]
> When a teacher logs in, they are immediately redirected to `/teacher`. Under no circumstances are they shown links to `/owner/fees`, `/owner/expenses`, `/owner/settings`, or institute revenue dashboards.

---

## 5. Security Gates & Anti-Tampering Rules

1. **Role Authority Derivation:** The user's role is never accepted from client-side cookies or headers. It is verified from `public.memberships.role` for the caller's active `auth.uid()`.
2. **Payment Reversal Immutability:** Only institute owners can reverse a payment. Reversals never delete the original payment row; they set `status = 'reversed'`, capture `reversal_reason`, record `reversed_by_user_id`, and log an immutable entry in `audit_logs`.
3. **Student Quota Barrier:** Even if an institute owner attempts to batch-import students, PostgreSQL trigger `trg_check_student_quota` halts execution if `active_student_count >= student_limit`.
4. **Attendance Modification Window:** Teachers can edit attendance sessions for up to 24 hours after creation. Edits after 24 hours require Owner or Admin approval.
