# FIXIA CoachingOS — First Coaching Institute Onboarding Runbook

**Document Version:** 1.0.0  
**Target Audience:** Coaching Institute Directors, Center Operations Managers, Customer Success Leads  
**Purpose:** Practical step-by-step onboarding walkthrough for setting up a new tuition center, school academic academy, or competitive exam coaching institute (JEE, NEET, CA, UPSC, K-12) on FIXIA CoachingOS.

---

## 1. Pre-Onboarding Checklist

Before initiating the system setup, assemble the following operational details:

1. **Institute Legal & Branding Details:**
   - Official Coaching Institute Name (e.g. *Radha Krishna Academy*).
   - Address, City, State, and Pincode.
   - Director / Founder Name and contact phone/email.
   - Coaching Registration / License Number (if registered with local authority/GST).
   - Preferred Receipt Prefix (e.g. `RKA-2026-`).
   - Official Logo file (PNG or JPG).
2. **Academic Structure:**
   - Academic Session (e.g. `2026-2027`).
   - Courses offered (e.g. Class 10 CBSE, Class 11 JEE Foundation, Class 12 Boards).
   - Subjects & batch schedules (days of week, timings, classroom numbers).
3. **Faculty & Staff Roster:**
   - Teacher names, email addresses, phone numbers, and assigned subjects/batches.
4. **Fee Structures:**
   - Fee plans per course (Monthly, Term, Annual, or Full Course lump sum amounts).
   - Authorized discount ceilings for merit/need-based concessions.

---

## 2. Step 1: Initial Account Creation & Institute Branding

1. Open your FIXIA CoachingOS login page: `https://your-domain.com/login`
2. Click **"Register New Institute"** (or receive credentials provisioned by FIXIA Customer Support).
3. Complete the onboarding wizard:
   - Director Name, Mobile, and Password.
   - Institute Name, Category (Academic K-12, Engineering/Medical, Commerce, Skills).
   - City and State.
4. Click **Complete Setup & Launch Institute**.
5. **Configure Branding & Receipt Settings:**
   - Navigate to **Institute Settings** (`/settings`).
   - Set your **Receipt Prefix** (e.g. `RKA-2026-`).
   - Configure your **Academic Session** (e.g. `2026-2027`).
   - Enter your **WhatsApp fee reminder template**.

---

## 3. Step 2: Configure Courses, Batches & Classroom Timetable

1. Navigate to **Batches & Courses** (`/batches`).
2. Click **Add New Batch**:
   - **Batch Name:** e.g. *Class 10th CBSE - Maths & Science Elite*
   - **Batch Code:** e.g. `BAT-101`
   - **Course:** *Class 10th CBSE*
   - **Instructor Name:** Select primary faculty instructor.
   - **Capacity:** e.g. `30 seats`
   - **Timing:** e.g. `04:30 PM - 06:00 PM`
   - **Schedule Days:** e.g. `Mon, Wed, Fri`
   - **Classroom / Room Number:** e.g. `Room 101`
3. Navigate to **Class Timetable** (`/timetable`):
   - Review the weekly Monday–Saturday timetable grid.
   - Click **Schedule New Slot** to add recurring lectures.
   - *Automated Collision Guard:* The system will alert you if an instructor or classroom is double-booked on overlapping timeslots.

---

## 4. Step 3: Set Up Fee Plans & Tuition Structures

1. Navigate to **Fees & Receipts** (`/fees`) > **Fee Plans** tab.
2. Click **Create New Fee Plan**:
   - **Plan Name:** e.g. *Class 10th Annual Comprehensive Tuition*
   - **Category:** *Academic Tuition*
   - **Amount:** e.g. `₹18,000`
   - **Billing Frequency:** *Monthly (₹1,500/mo)*, *Quarterly*, or *Annual Full Course*.
   - **Due Day of Month:** e.g. `10th`
   - **Max Authorized Concession:** e.g. `15%`
3. Save the plan. This template can now be linked to students during admission.

---

## 5. Step 4: Student Admissions & Enrollment

1. Navigate to **Students** (`/students`).
2. Click **New Student Admission**:
   - **Personal Details:** Full name, mobile, email, gender, home area/address.
   - **Guardian Information:** Father/Mother/Guardian name, relationship, guardian mobile number.
   - **Academic Cohort:** Select the target batch.
   - **Fee Plan:** Select the fee structure created in Step 3.
   - **Discount / Concession (Optional):** Enter any authorized fee waiver with mandatory justification note.
3. Click **Confirm Admission**.
   - The student is registered, an official ID is generated (e.g. `FIX-2026-001`), and their opening ledger is created automatically.
   - *Student Quota Note:* The system prevents admission if your institute enrollment reaches your commercial plan capacity.

---

## 6. Step 5: Invite Teachers & Set Up Class Portals

1. Navigate to **Staff & Faculty** (`/staff`).
2. Click **Invite Faculty Member**:
   - Enter teacher's full name, email, mobile number, and specialization subjects.
   - Select the batches they are authorized to teach.
3. **Teacher Portal Handoff:**
   - Provide the faculty member with their login email and the Teacher Portal URL: `https://your-domain.com/teacher`.
   - When the teacher logs in, they see **only their assigned batches** and a mobile-friendly attendance roll-call interface.
   - Teachers cannot view institute revenues, expenses, other teachers' data, or unauthorized student profiles.

---

## 7. Step 6: Daily Operational Routine

### Morning / Evening: Class Roll-Call
1. The teacher logs into `/teacher` from their smartphone or tablet.
2. Under **Today's Classes**, they tap **Open Attendance Terminal** for their batch.
3. Tap **Present**, **Absent**, or **Late** for each student (or tap **Mark All Present** and toggle the absentees).
4. Tap **Review & Submit Attendance**.
5. Once saved, the session is recorded in the permanent institutional database.

### Front-Desk: Fee Collection & Official Receipts
1. When a parent or student pays tuition, the front-desk coordinator navigates to `/fees`.
2. Find the student and click **Collect Fee**:
   - Enter the collected amount (e.g. `₹1,500`).
   - Select the payment method: **UPI**, **Cash**, **Bank Transfer**, or **Cheque**.
   - Enter the transaction reference ID (e.g. UPI UTR number or bank cheque number).
3. Click **Confirm & Print Receipt**:
   - An official print-ready receipt opens automatically with student details, batch, payment breakdown, and remaining dues.
   - Click **Print** or **Save as PDF** to hand over or send via WhatsApp to the parent.

### Center Expenses & Outflows
1. When paying rent, teacher salaries, electricity, or test paper printing, navigate to **Expenses & Outflow** (`/expenses`).
2. Click **Record New Expense**:
   - Select category (*Rent*, *Teacher Salaries*, *Utilities*, *Stationery/DPPs*, *Marketing*, *Maintenance*).
   - Enter amount and recipient name.
   - Enter payment mode and voucher reference number.
3. Click **Save Voucher**.
4. The dashboard automatically computes your true **Net Operating Income**:  
   $$\text{Net Operating Income} = \text{Actual Cash Collections} - \text{Recorded Expenses}$$

---

## 8. Customer Support & Assistance

For technical assistance, commercial plan quota upgrades, or custom development requirements:
- **FIXIA Cloud Support:** `support@fixia.in`
- **Emergency Ops Desk:** `+91 98000 00000` (Mon–Sat, 09:00 AM – 08:00 PM IST)
- **Help Center:** [https://docs.fixia.in](https://docs.fixia.in)
