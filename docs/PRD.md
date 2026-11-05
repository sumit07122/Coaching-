# FIXIA CoachingOS — Product Requirements Document (PRD)

## 1. Document Control
- **Product:** FIXIA CoachingOS
- **Phase:** Phase 0 (Product Discovery & Interactive Clickable Prototype)
- **Target Geography:** Mathura–Vrindavan (Tier 2/3 education hubs in Uttar Pradesh, expanding nationwide)
- **Target Customer:** Independent Coaching Institute Owners (< 100 students)
- **Document Version:** 1.0.0

---

## 2. Problem Statement
Small coaching institute operators in India are typically lead educators who handle teaching, parent relations, administration, and fee collection simultaneously. Today, their operations suffer from:
1. **Attendance Friction:** Physical paper registers take 15–20 minutes per batch, prone to student proxies and paper damage.
2. **Scattered Fee Records:** Fees collected in cash or UPI are scribbled into personal diaries, causing forgotten balances, duplicate demands, and disputes with parents.
3. **Unprofessional Parent Touchpoints:** Lack of computerized receipts diminishes parent trust and prestige compared to corporate franchised coaching chains (Allen, Aakash, PhysicsWallah).
4. **Software Complexity Overkill:** Existing school ERPs (Teachmint, Classpro) demand extensive training, require complex fee hierarchies, and overwhelm small 2-to-5 room coaching centres.

---

## 3. Product Vision & Principles
**FIXIA CoachingOS** is built on the philosophy of **"Simplicity over Extensibility"**:
- **Zero-Training Required:** Any non-technical teacher or receptionist should master all daily workflows in under 5 minutes.
- **Speed-First Design:** Routine tasks (marking batch attendance, logging a partial fee payment) must take under 15 seconds.
- **Indian Coaching Realities Built-In:** First-class support for partial split payments (UPI + cash), monthly tuition instalments, and WhatsApp communication.
- **Configurable Archetypes:** Standard core that easily adapts between Academic K-12, Engineering/Medical Entrance, and Skill/Language institutes.

---

## 4. User Personas
### 1. Er. Rakesh Sharma (Institute Director & Lead Faculty)
- *Needs:* Real-time view of daily institute cashflow, overdue fee balances, and batch strength.
- *Frustration:* Forgetting which student owes partial fees at month-end.

### 2. Pooja Verma (Front-Desk & Academic Coordinator)
- *Needs:* Fast student admissions, instant fee receipt generation for parents standing at the counter, and daily absentee follow-ups.
- *Frustration:* Calculating balances manually with a desk calculator.

### 3. Amit Upadhyay (Senior Faculty Member)
- *Needs:* Viewing assigned batch rosters and taking daily attendance with 1 click.
- *Constraint:* Should have zero access to student fee ledgers.

---

## 5. Scope of Phase 0 Prototype
### In Scope:
1. Complete clickable React + TypeScript frontend running locally.
2. Exactly 85 students, 6 batches, 72 present today, 13 absent today, ₹32,000 monthly collections, ₹18,500 pending fees.
3. 10 interactive screens: Login, Dashboard, Students, Student Profile, Batches, Attendance, Fees, Receipt Preview, Reports, Settings.
4. Working in-browser persistence (localStorage) for demo interactions.
5. Functional CSV export and printable receipt layout.
6. Multi-tenant SaaS architecture blueprint.

### Out of Scope (Future Phases):
- Live backend databases (PostgreSQL/Supabase).
- Live payment gateway webhooks (Razorpay/Cashfree).
- Automated SMS/WhatsApp API dispatchers (simulated via clipboard in Phase 0).
