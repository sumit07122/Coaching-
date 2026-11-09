# FIXIA CoachingOS — Teacher Class Attendance Portal Specification
**Document Version:** 1.0.0  
**Phase:** 11 — Architecture & System Audit  
**Author:** Senior SaaS Product Architect & UI/UX Lead  
**Status:** Approved Feature Specification  

---

## 1. Executive Summary & Persona Context

The **Teacher Class Attendance Portal** is a high-speed, mobile-first web interface designed exclusively for faculty instructors, teachers, and teaching assistants. 

### Persona Profile
- **User:** Subject Teacher / Lecturer (e.g., Er. Vikram Singh, Senior Physics Faculty).
- **Environment:** Inside a physical classroom or tuition hall, on a smartphone, tablet, or classroom podium laptop.
- **Time Constraint:** 3–5 minutes between consecutive 90-minute lectures.
- **Primary Need:** Open the class, verify presence in under 30 seconds, submit, and proceed with the lecture.
- **Security Boundary:** **Zero access** to institute revenues, student fee dues, other teachers' lectures, or owner settings.

---

## 2. Dedicated Portal Routes

```
/teacher
├── /                      --> Teacher Class Overview (Today's Classes & Quick Schedule)
├── /attendance/:batchId   --> Live Roll-Call Terminal (Fast Present/Absent/Late Roster)
└── /history               --> Teacher Class Attendance History & Roll Inspection
```

---

## 3. Screen-by-Screen Functional Specifications

### Screen 1: Teacher Class Overview (`/teacher`)
The landing screen immediately upon teacher authentication.

```
+-------------------------------------------------------------------------+
| FIXIA CoachingOS | Teacher Portal          Mathura Academy | Vikram S.  |
+-------------------------------------------------------------------------+
| Good Morning, Vikram Singh!                                            |
| Today: Monday, 09 Nov 2026 • 3 Lectures Assigned                        |
|                                                                         |
| [ Today's Schedule & Attendance Status ]                                |
|                                                                         |
| +---------------------------------------------------------------------+ |
| | Class 12 - Shikhar Alpha (Physics)                 [ ROOM 204 ]     | |
| | Timing: 08:00 AM - 09:30 AM (28 Students)                           | |
| | Status: [ PENDING ATTENDANCE ]             [ TAKE ATTENDANCE -> ]   | |
| +---------------------------------------------------------------------+ |
|                                                                         |
| +---------------------------------------------------------------------+ |
| | Class 11 - Pratham Beta (Physics)                  [ ROOM 102 ]     | |
| | Timing: 10:00 AM - 11:30 AM (24 Students)                           | |
| | Status: [ COMPLETED • 92% Present ]        [ VIEW RECORD ]          | |
| +---------------------------------------------------------------------+ |
|                                                                         |
| +---------------------------------------------------------------------+ |
| | NEET Repeater Alpha (Mechanics)                   [ ROOM 204 ]     | |
| | Timing: 04:00 PM - 05:30 PM (30 Students)                           | |
| | Status: [ UPCOMING ]                       [ PREVIEW ROSTER ]       | |
| +---------------------------------------------------------------------+ |
+-------------------------------------------------------------------------+
```

**Key Features:**
- **Assigned Batches Only:** Queries and displays **only** cohorts where `instructor_user_id = auth.uid()` or batch id is contained in `memberships.assigned_batches`.
- **Dynamic Lecture Status:**
  - `Pending`: No attendance session has been submitted for today. Displays a high-contrast amber indicator and a prominent **"Take Attendance"** button.
  - `Completed`: Marked today. Displays green badge with attendance rate (e.g. `96% Present`).
  - `Upcoming`: Lectures scheduled for later in the day.
- **Quick Metrics:** Count of classes assigned today, classes marked, and total students taught today.

---

### Screen 2: High-Speed Roll-Call Terminal (`/teacher/attendance/:batchId`)
The core recording terminal engineered for maximum speed and ergonomic touch usability.

```
+-------------------------------------------------------------------------+
| [<- Back to Classes]     Class 12 - Shikhar Alpha     Date: [09/11/2026]|
| Total: 28  •  Present: 26  •  Absent: 2  •  Late: 0  •  Rate: 93%       |
+-------------------------------------------------------------------------+
| [ QUICK ACTION: MARK ALL PRESENT (TAP ONCE) ]                           |
| [ Search Student Name or Roll Number...                              ]  |
+-------------------------------------------------------------------------+
|                                                                         |
| 1. Aarav Sharma [FIX-26-001]                                            |
|    Status: ( PRESENT )   [ Absent ]   [ Late ]          [+ Note]        |
|                                                                         |
| 2. Ananya Patel [FIX-26-002]                                            |
|    Status: [ Present ]   ( ABSENT )   [ Late ]          [ Sick Note ]   |
|                                                                         |
| 3. Devansh Gupta [FIX-26-003]                                           |
|    Status: ( PRESENT )   [ Absent ]   [ Late ]          [+ Note]        |
|                                                                         |
| 4. Ishaan Verma [FIX-26-004]                                            |
|    Status: ( PRESENT )   [ Absent ]   [ Late ]          [+ Note]        |
|                                                                         |
| ...                                                                     |
+-------------------------------------------------------------------------+
| Lecture Topic / Session Notes:                                          |
| [ Covered Chapter 4: Rotational Dynamics (Problems 1-15)             ]  |
+-------------------------------------------------------------------------+
| [ SUBMIT ATTENDANCE FOR 28 STUDENTS (PROCEED) ]                         |
+-------------------------------------------------------------------------+
```

**Ergonomic Speed Optimizations:**
1. **One-Tap "Mark All Present":** Instantly toggles all students to `Present`. The teacher then only taps the 1 or 2 absentees, completing attendance for 30 students in under 10 seconds.
2. **Three High-Contrast Pill Buttons per Student:**
   - `Present`: Green (`#059669`).
   - `Absent`: Red (`#dc2626`).
   - `Late`: Amber (`#d97706`).
   - Minimum tap target: 48px height to prevent accidental mis-taps on mobile touchscreens.
3. **Session Notes:** Optional field for teachers to record topics taught or homework assigned.
4. **Duplicate Prevention:** Submitting updates existing session records via PostgreSQL `upsert` rather than creating duplicate sessions.
5. **Confirmation Modal:** Displays a summary modal before submission ("Confirm: 26 Present, 2 Absent?").

---

### Screen 3: Teacher Attendance History (`/teacher/history`)
Allows teachers to audit their own past attendance records.

**Key Features:**
- Filter by assigned batch and calendar date range.
- Table of past sessions:
  - Session Date.
  - Batch Name.
  - Enrolled Count, Present Count, Absent Count.
  - Attendance Rate (%).
  - Session Notes.
  - Submission Timestamp and Edit History.
- **Absent Student Inspection:** Click any session row to expand the exact list of absent students for that lecture.
- **Restricted Edit Window:** Teachers may update past sessions within a 24-hour window. Edits beyond 24 hours require Owner administrative override.

---

## 4. Strict Security & Information Sandboxing

The teacher portal enforces strict data shielding:

| Data Field | Visible in Owner Portal? | Visible in Teacher Portal? | Rationale |
| :--- | :---: | :---: | :--- |
| **Student Full Name** | Yes | **Yes** | Required for roll call. |
| **Student Roll/ID** | Yes | **Yes** | Required for roll call. |
| **Student Guardian Phone** | Yes | **Masked / Hidden** | Prevents unsolicited faculty contact or poaching. |
| **Student Fee Balance** | Yes | **STRICTLY BLOCKED** | Financial confidentiality. Zero teacher access. |
| **Payment History** | Yes | **STRICTLY BLOCKED** | Financial confidentiality. Zero teacher access. |
| **Other Batches / Roster** | Yes | **STRICTLY BLOCKED** | Isolation between faculty members. |
| **Institute Revenue** | Yes | **STRICTLY BLOCKED** | Sensitive business metric. |
| **Staff Salary / Honorarium** | Yes | **STRICTLY BLOCKED** | Owner confidential. |

---

## 5. Offline & Flaky Connection Handling

Tuition classrooms often suffer from weak cellular reception in basements or high-density buildings:
- The teacher portal caches the active student roster in browser memory upon loading.
- Tapping attendance functions 100% smoothly offline.
- When tapping **Submit**:
  - If online: Syncs to Supabase immediately.
  - If offline: Queues session in `IndexedDB` / `localStorage` with a visual indicator ("Pending Sync - 1 Session Queued"). Automatically flushes to Supabase upon reconnection.
