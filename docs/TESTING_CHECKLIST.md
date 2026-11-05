# FIXIA CoachingOS — Phase 0 Manual Testing Checklist

Use this checklist to verify all features and user journeys of the clickable prototype.

---

## 1. Authentication & Role Switcher
- [ ] Navigate to `/login`.
- [ ] Verify institute branding displays "Radha Krishna Academy, Mathura".
- [ ] Select persona: **Er. Rakesh Sharma (Owner)** -> Click "Enter Demo Workspace" -> Lands on Dashboard.
- [ ] In the top demo banner, use the persona dropdown to switch to **Pooja Verma (Admin)** -> Verify sidebar shows updated name and role.
- [ ] In the top demo banner, click "SaaS Architecture Blueprint" -> Modal opens with RLS, RBAC, and commercialization details.

---

## 2. Dashboard Verification (Initial State)
- [ ] **Total Students:** Shows **85** students.
- [ ] **Active Batches:** Shows **6** active batches.
- [ ] **Students Present Today:** Shows **72** students.
- [ ] **Students Absent Today:** Shows **13** students (Attendance rate: 84.7%).
- [ ] **Collected This Month:** Shows **₹32,000**.
- [ ] **Pending Fees Dues:** Shows **₹18,500**.
- [ ] Verify Attendance Overview shows batch-by-batch progress bars.
- [ ] Verify Recent Collections table lists transactions with receipt view button.
- [ ] Click "Receipt" button on any row -> Printable receipt modal pops open with accurate data.

---

## 3. Student Management
- [ ] Navigate to `/students`.
- [ ] Search for "Aarav" -> Only Aarav Sharma displays. Clear search -> 85 students restore.
- [ ] Filter by Batch: Select "Class 10th CBSE - Maths & Science" -> Shows 16 students.
- [ ] Filter by Fee Status: Select "Partial Dues" -> Shows students with pending balance.
- [ ] Click **"Add New Student"**:
  - Enter Name: "Priyanshu Goyal"
  - Enter Phone: "+91 94120 77123"
  - Enter Guardian: "Sunil Goyal"
  - Select Batch: "Class 10th CBSE"
  - Total Fee: ₹10,000, Initial Payment: ₹3,000.
  - Click "Save & Enroll Student".
  - Verify student count increases to 86, and student appears in list.
- [ ] Click "Edit Student" on any row -> Modify notes or phone -> Save -> Updates reflected.
- [ ] Click on student name -> Navigates to `/students/:id`.

---

## 4. Student Profile View
- [ ] Verify Student details, roll ID, phone, guardian name, and batch display correctly.
- [ ] Verify Attendance score (Present, Absent, Rate %) is displayed.
- [ ] Verify Financial Ledger shows Total Invoiced, Total Paid, and Remaining Balance.
- [ ] Click "Collect Instalment" -> Opens Record Payment modal with student pre-selected.
- [ ] Click "WhatsApp Fee Notice" -> Verifies clipboard copy feedback.

---

## 5. Batch Management
- [ ] Navigate to `/batches`.
- [ ] Verify 6 batches display with timing, schedule, capacity bar, and student count.
- [ ] Click "View Roster" on any batch -> Modal opens showing list of enrolled students.
- [ ] Click "Create New Batch" -> Enter batch name, timing, and fee -> Save -> New batch added.
- [ ] Click "Assign" on a batch -> Check students from other batches -> Save -> Students transferred.

---

## 6. Daily Attendance Terminal
- [ ] Navigate to `/attendance`.
- [ ] Select batch: "Class 10th CBSE - Maths & Science".
- [ ] Change Date to today's date (`2026-11-03`).
- [ ] Verify live counters show Enrolled, Present, Absent, and Attendance %.
- [ ] Click "Absent" on a present student -> Absent counter increments immediately.
- [ ] Click "Mark All Present" -> All students in batch marked Present, counter updates to 100%.
- [ ] Click "Save Attendance" -> Green success banner confirms records saved to state.

---

## 7. Fee Management & Official Receipts
- [ ] Navigate to `/fees`.
- [ ] Check high-level cards: Invoiced, Collected This Month (₹32,000), Outstanding (₹18,500).
- [ ] Switch to **"Payment Transactions"** tab -> View chronological list of recent receipts.
- [ ] Switch to **"Institute Fee Plans"** tab -> View pre-configured fee plans.
- [ ] In Student Fee Ledger tab, click "Collect" on a student with dues:
  - Enter payment amount (e.g., ₹1,000).
  - Select payment mode: "UPI".
  - Click "Record & Preview Receipt".
- [ ] **Receipt Modal:**
  - Verify receipt shows institute header (Radha Krishna Academy, Mathura).
  - Verify receipt number (e.g. `RCP-2026-0089`).
  - Verify amount in words ("Rupees One Thousand Only").
  - Verify remaining balance correctly updated.
  - Click "Copy Parent WhatsApp Text" -> Toast confirms clipboard copy.
  - Click "Print / Save PDF" -> Triggers browser print preview.

---

## 8. Intelligence & Reports
- [ ] Navigate to `/reports`.
- [ ] View "Outstanding Fee Defaulters" report.
- [ ] Filter by Batch -> Report updates.
- [ ] Click **"Export Active Report (CSV)"** -> Browser downloads `FIXIA_pending_report_2026-11-03.csv`.
- [ ] Open CSV in Excel / text editor -> Verify columns and data integrity.

---

## 9. Institute Settings & Demo Reset
- [ ] Navigate to `/settings`.
- [ ] Change Institute Name to "Radhey Coaching Institute".
- [ ] Select Coaching Archetype: "Science & Competitive (JEE / NEET / NDA)".
- [ ] Click "Save Changes" -> Success banner confirms.
- [ ] Verify header and receipts reflect new institute branding.
- [ ] Click "Reset Demo Data" in header or settings -> Confirm dialog -> Data reverts to factory 85 students, 6 batches, ₹32k collected, ₹18.5k pending.
