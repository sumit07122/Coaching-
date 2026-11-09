/**
 * FIXIA CoachingOS — Supabase Data Access & Persistence Layer
 * 
 * Provides clean bi-directional mapping between PostgreSQL relational tables (snake_case)
 * and TypeScript domain models (camelCase).
 * 
 * Enforces institute_id tenant boundary on every query and mutation.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Student,
  Batch,
  DailyAttendanceRecord,
  AttendanceSession,
  SaveAttendanceSessionInput,
  PaymentTransaction,
  FeePlan,
  CreateFeePlanInput,
  AssignFeePlanInput,
  StaffMember,
  AuditLog,
  CommercialSubscription,
  PaymentMethod,
  AttendanceStatus,
  FeeStatus,
  UserRole,
  Expense,
  ExpenseCategory,
  ExpensePaymentMode,
  BatchSchedule,
  StudentBatchTransfer,
} from '../types';

// ==============================================================================
// 1. Domain Mappers (Database snake_case <-> Domain camelCase)
// ==============================================================================

export function mapStudentFromDb(row: any): Student {
  return {
    id: row.id,
    instituteId: row.institute_id,
    institute_id: row.institute_id,
    studentId: row.student_id,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email || undefined,
    address: row.address || undefined,
    guardianName: row.guardian_name,
    guardianPhone: row.guardian_phone || row.phone,
    guardianRelation: (row.guardian_relation || 'Father') as 'Father' | 'Mother' | 'Guardian',
    course: row.course,
    batchId: row.batch_id || '',
    batchName: row.batches?.name || 'Unassigned Cohort',
    admissionDate: row.admission_date,
    gender: (row.gender || 'Male') as 'Male' | 'Female' | 'Other',
    status: (row.status || 'active') as 'active' | 'archived',
    feeStatus: (row.fee_status || 'overdue') as FeeStatus,
    totalFeeInvoiced: Number(row.total_fee_invoiced) || 0,
    totalFeePaid: Number(row.total_fee_paid) || 0,
    balanceFee: Number(row.balance_fee) || 0,
    lastPaymentDate: row.last_payment_date || undefined,
    notes: row.notes || undefined,
    avatarSeed: row.full_name.toLowerCase().replace(/\s+/g, '-'),
    feePlanId: row.fee_plan_id || undefined,
    feePlanName: row.fee_plan_name || undefined,
    feeDueDate: row.fee_due_date || '10th of Month',
    discountAmount: row.discount_amount ? Number(row.discount_amount) : undefined,
    discountReason: row.discount_reason || undefined,
  };
}

export function mapStudentToDb(student: Partial<Student>, instituteId: string): any {
  const dbRecord: any = {
    institute_id: instituteId,
  };

  if (student.studentId !== undefined) dbRecord.student_id = student.studentId;
  if (student.fullName !== undefined) dbRecord.full_name = student.fullName;
  if (student.phone !== undefined) dbRecord.phone = student.phone;
  if (student.email !== undefined) dbRecord.email = student.email || null;
  if (student.address !== undefined) dbRecord.address = student.address || null;
  if (student.guardianName !== undefined) dbRecord.guardian_name = student.guardianName;
  if (student.guardianPhone !== undefined) dbRecord.guardian_phone = student.guardianPhone;
  if (student.guardianRelation !== undefined) dbRecord.guardian_relation = student.guardianRelation;
  if (student.course !== undefined) dbRecord.course = student.course;
  if (student.batchId !== undefined) dbRecord.batch_id = student.batchId || null;
  if (student.admissionDate !== undefined) dbRecord.admission_date = student.admissionDate;
  if (student.gender !== undefined) dbRecord.gender = student.gender;
  if (student.status !== undefined) dbRecord.status = student.status;
  if (student.feeStatus !== undefined) dbRecord.fee_status = student.feeStatus;
  if (student.totalFeeInvoiced !== undefined) dbRecord.total_fee_invoiced = student.totalFeeInvoiced;
  if (student.totalFeePaid !== undefined) dbRecord.total_fee_paid = student.totalFeePaid;
  if (student.balanceFee !== undefined) dbRecord.balance_fee = student.balanceFee;
  if (student.lastPaymentDate !== undefined) dbRecord.last_payment_date = student.lastPaymentDate || null;
  if (student.notes !== undefined) dbRecord.notes = student.notes || null;

  return dbRecord;
}

export function mapBatchFromDb(row: any, studentCount: number = 0): Batch {
  return {
    id: row.id,
    instituteId: row.institute_id,
    institute_id: row.institute_id,
    code: row.code,
    name: row.name,
    course: row.course,
    instructor: row.instructor_name || 'Faculty Assigned',
    instructorUserId: row.instructor_user_id || undefined,
    scheduleDays: row.schedule_days,
    timing: row.timing,
    room: row.room || 'Room 101',
    capacity: row.capacity || 20,
    studentCount: studentCount,
    monthlyFee: Number(row.monthly_fee) || 0,
    status: (row.status || 'active') as 'active' | 'completed' | 'upcoming',
    startDate: row.start_date || new Date().toISOString().split('T')[0],
  };
}

export function mapBatchToDb(batch: Partial<Batch>, instituteId: string): any {
  const dbRecord: any = {
    institute_id: instituteId,
  };

  if (batch.code !== undefined) dbRecord.code = batch.code;
  if (batch.name !== undefined) dbRecord.name = batch.name;
  if (batch.course !== undefined) dbRecord.course = batch.course;
  if (batch.instructor !== undefined) dbRecord.instructor_name = batch.instructor;
  if (batch.instructorUserId !== undefined) dbRecord.instructor_user_id = batch.instructorUserId || null;
  if (batch.scheduleDays !== undefined) dbRecord.schedule_days = batch.scheduleDays;
  if (batch.timing !== undefined) dbRecord.timing = batch.timing;
  if (batch.room !== undefined) dbRecord.room = batch.room;
  if (batch.capacity !== undefined) dbRecord.capacity = batch.capacity;
  if (batch.monthlyFee !== undefined) dbRecord.monthly_fee = batch.monthlyFee;
  if (batch.status !== undefined) dbRecord.status = batch.status;
  if (batch.startDate !== undefined) dbRecord.start_date = batch.startDate;

  return dbRecord;
}

export function mapPaymentFromDb(row: any): PaymentTransaction {
  return {
    id: row.id,
    instituteId: row.institute_id,
    institute_id: row.institute_id,
    receiptNumber: row.receipt_number,
    studentId: row.student_id,
    studentName: row.students?.full_name || 'Enrolled Student',
    batchId: row.batch_id || '',
    batchName: row.batches?.name || 'Class Cohort',
    amount: Number(row.amount) || 0,
    paymentMethod: row.payment_method as PaymentMethod,
    paymentDate: row.payment_date,
    collectedBy: row.collected_by_name,
    remarks: row.remarks || undefined,
    invoicedAmount: Number(row.invoiced_amount) || 0,
    paidAmountPrior: Number(row.paid_amount_prior) || 0,
    balanceRemaining: Number(row.balance_remaining) || 0,
    status: (row.status || 'confirmed') as 'confirmed' | 'reversed',
    reversalReason: row.reversal_reason || undefined,
    reversedAt: row.reversed_at || undefined,
  };
}

export function mapPaymentToDb(payment: Partial<PaymentTransaction>, instituteId: string): any {
  return {
    institute_id: instituteId,
    receipt_number: payment.receiptNumber,
    student_id: payment.studentId,
    batch_id: payment.batchId || null,
    amount: payment.amount,
    payment_method: payment.paymentMethod,
    payment_date: payment.paymentDate || new Date().toISOString().split('T')[0],
    collected_by_name: payment.collectedBy,
    remarks: payment.remarks || null,
    invoiced_amount: payment.invoicedAmount,
    paid_amount_prior: payment.paidAmountPrior,
    balance_remaining: payment.balanceRemaining,
    status: payment.status || 'confirmed',
    reversal_reason: payment.reversalReason || null,
    reversed_at: payment.reversedAt || null,
  };
}

export function mapFeePlanFromDb(row: any): FeePlan {
  return {
    id: row.id,
    instituteId: row.institute_id,
    institute_id: row.institute_id,
    name: row.name,
    category: row.category,
    amount: Number(row.amount) || 0,
    billingFrequency: row.billing_frequency as any,
    description: row.description || '',
    dueDayOfMonth: 10,
    maxAuthorizedDiscountPercent: 20,
  };
}

export function mapFeePlanToDb(plan: Partial<FeePlan>, instituteId: string): any {
  return {
    institute_id: instituteId,
    name: plan.name,
    category: plan.category,
    amount: plan.amount,
    billing_frequency: plan.billingFrequency,
    description: plan.description || null,
  };
}

export function mapAttendanceSessionFromDb(row: any): AttendanceSession {
  const total = Number(row.total_enrolled) || 0;
  const present = Number(row.total_present) || 0;
  const rate = total > 0 ? Math.round((present / total) * 100) : 0;

  return {
    id: row.id,
    instituteId: row.institute_id,
    institute_id: row.institute_id,
    batchId: row.batch_id,
    sessionDate: row.session_date,
    markedByUserId: row.marked_by_user_id || '',
    markedByUserName: row.profiles?.full_name || 'Faculty Staff',
    totalEnrolled: total,
    totalPresent: present,
    totalAbsent: Number(row.total_absent) || 0,
    totalLate: Number(row.total_late) || 0,
    attendanceRate: rate,
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapAttendanceRecordFromDb(row: any): DailyAttendanceRecord {
  return {
    id: row.id,
    instituteId: row.institute_id,
    institute_id: row.institute_id,
    sessionId: row.session_id,
    batchId: row.attendance_sessions?.batch_id || '',
    date: row.attendance_sessions?.session_date || new Date().toISOString().split('T')[0],
    studentId: row.student_id,
    studentName: row.students?.full_name || 'Enrolled Student',
    status: row.status as AttendanceStatus,
    remarks: row.remarks || undefined,
    updatedAt: row.marked_at,
  };
}

export function mapStaffFromDb(membershipRow: any): StaffMember {
  const p = membershipRow.profiles || {};
  return {
    id: membershipRow.id,
    instituteId: membershipRow.institute_id,
    institute_id: membershipRow.institute_id,
    name: p.full_name || 'Faculty Member',
    email: p.email || '',
    phone: p.phone || '+91 94120 00000',
    role: (membershipRow.role === 'staff' ? 'faculty' : membershipRow.role) as any,
    roleTitle: membershipRow.role_title || 'Faculty',
    subjects: ['Core Academic Curriculum'],
    assignedBatchIds: Array.isArray(membershipRow.assigned_batches) ? membershipRow.assigned_batches : [],
    joiningDate: membershipRow.created_at ? membershipRow.created_at.split('T')[0] : '2026-04-01',
    status: membershipRow.is_active ? 'active' : 'inactive',
  };
}

export function mapAuditLogFromDb(row: any): AuditLog {
  return {
    id: row.id,
    instituteId: row.institute_id,
    userId: row.user_id || 'system',
    userName: row.profiles?.full_name || 'Staff User',
    action: row.action,
    entityType: row.entity_type as any,
    entityId: row.entity_id || '',
    details: row.details || {},
    createdAt: row.created_at,
  };
}

export function mapCommercialSubFromDb(row: any): CommercialSubscription {
  return {
    id: row.id,
    instituteId: row.institute_id,
    institute_id: row.institute_id,
    modelType: row.model_type || 'saas_subscription',
    planName: row.plan_name || 'Growth Plan',
    status: row.status || 'active',
    subscriptionStatus: row.subscription_status || 'active',
    licenceStatus: row.licence_status || 'not_applicable',
    billingCycle: row.billing_cycle || 'monthly',
    studentLimit: Number(row.student_limit) || 100,
    enabledModules: Array.isArray(row.enabled_modules)
      ? row.enabled_modules
      : ['students', 'batches', 'attendance', 'fees', 'reports', 'staff'],
    setupFeePaid: Number(row.setup_fee_paid) || 0,
    recurringAmount: Number(row.recurring_amount) || 999,
    renewalDate: row.renewal_date || undefined,
    licencePurchaseFee: Number(row.licence_purchase_fee) || 0,
    licenceKey: row.licence_key || undefined,
    licenceStartDate: row.licence_start_date || undefined,
    licenceExpiryDate: row.licence_expiry_date || undefined,
    licensedVersion: row.licensed_version || 'v1.0.0',
    hostingResponsibility: row.hosting_responsibility || 'FIXIA Cloud (AWS Mumbai)',
    maintenanceResponsibility: row.maintenance_responsibility || undefined,
    upgradeEntitlement: row.upgrade_entitlement || undefined,
    supportEntitlement: row.support_entitlement || 'Standard Email & Priority WhatsApp Support',
    sourceCodeOwnership: false,
    customRequirements: row.custom_requirements || undefined,
    quotationReference: row.quotation_reference || undefined,
    quotationAmount: Number(row.quotation_amount) || 0,
    definedScope: row.defined_scope || undefined,
    milestoneStatus: row.milestone_status || 'in_development',
    deliveryDate: row.delivery_date || undefined,
    deliveryNotes: row.delivery_notes || undefined,
    supportAgreement: row.support_agreement || undefined,
  };
}

export function mapExpenseFromDb(row: any): Expense {
  return {
    id: row.id,
    instituteId: row.institute_id,
    institute_id: row.institute_id,
    category: row.category as ExpenseCategory,
    amount: Number(row.amount) || 0,
    expenseDate: row.expense_date,
    title: row.title,
    recipient: row.recipient || undefined,
    paymentMode: (row.payment_mode || 'upi') as ExpensePaymentMode,
    referenceNumber: row.reference_number || undefined,
    notes: row.notes || undefined,
    receiptVoucherUrl: row.receipt_voucher_url || undefined,
    createdBy: row.created_by || undefined,
    isVoided: Boolean(row.is_voided),
    voidedAt: row.voided_at || undefined,
    voidedBy: row.voided_by || undefined,
    voidReason: row.void_reason || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapExpenseToDb(expense: Partial<Expense>, instituteId: string): any {
  const dbRecord: any = {
    institute_id: instituteId,
  };

  if (expense.category !== undefined) dbRecord.category = expense.category;
  if (expense.amount !== undefined) dbRecord.amount = expense.amount;
  if (expense.expenseDate !== undefined) dbRecord.expense_date = expense.expenseDate;
  if (expense.title !== undefined) dbRecord.title = expense.title;
  if (expense.recipient !== undefined) dbRecord.recipient = expense.recipient || null;
  if (expense.paymentMode !== undefined) dbRecord.payment_mode = expense.paymentMode;
  if (expense.referenceNumber !== undefined) dbRecord.reference_number = expense.referenceNumber || null;
  if (expense.notes !== undefined) dbRecord.notes = expense.notes || null;
  if (expense.receiptVoucherUrl !== undefined) dbRecord.receipt_voucher_url = expense.receiptVoucherUrl || null;

  return dbRecord;
}

export function mapScheduleFromDb(row: any): BatchSchedule {
  return {
    id: row.id,
    instituteId: row.institute_id,
    institute_id: row.institute_id,
    batchId: row.batch_id,
    dayOfWeek: row.day_of_week,
    startTime: row.start_time,
    endTime: row.end_time,
    roomNumber: row.room_number || undefined,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapScheduleToDb(schedule: Partial<BatchSchedule>, instituteId: string): any {
  const dbRecord: any = {
    institute_id: instituteId,
  };

  if (schedule.batchId !== undefined) dbRecord.batch_id = schedule.batchId;
  if (schedule.dayOfWeek !== undefined) dbRecord.day_of_week = schedule.dayOfWeek;
  if (schedule.startTime !== undefined) dbRecord.start_time = schedule.startTime;
  if (schedule.endTime !== undefined) dbRecord.end_time = schedule.endTime;
  if (schedule.roomNumber !== undefined) dbRecord.room_number = schedule.roomNumber || null;
  if (schedule.isActive !== undefined) dbRecord.is_active = schedule.isActive;

  return dbRecord;
}

export function mapTransferFromDb(row: any): StudentBatchTransfer {
  return {
    id: row.id,
    instituteId: row.institute_id,
    institute_id: row.institute_id,
    studentId: row.student_id,
    studentName: row.students?.full_name || undefined,
    fromBatchId: row.from_batch_id || undefined,
    fromBatchName: row.from_batch?.name || undefined,
    toBatchId: row.to_batch_id || undefined,
    toBatchName: row.to_batch?.name || undefined,
    transferDate: row.transfer_date,
    reason: row.reason || undefined,
    transferredBy: row.transferred_by || undefined,
    createdAt: row.created_at,
  };
}

// ==============================================================================
// 2. Data Access Queries (READ)
// ==============================================================================

export interface InstituteDataPayload {
  students: Student[];
  batches: Batch[];
  attendance: DailyAttendanceRecord[];
  attendanceSessions: AttendanceSession[];
  payments: PaymentTransaction[];
  feePlans: FeePlan[];
  staff: StaffMember[];
  auditLogs: AuditLog[];
  commercialSubscription: CommercialSubscription;
  expenses: Expense[];
  batchSchedules: BatchSchedule[];
  batchTransfers: StudentBatchTransfer[];
}

/**
 * Fetch all institute records from Supabase tables for the given instituteId.
 * Guarantees Row-Level Security and tenant isolation at the database level.
 */
export async function fetchInstituteData(instituteId: string): Promise<InstituteDataPayload | null> {
  if (!isSupabaseConfigured || !instituteId || instituteId === 'PENDING_ONBOARDING') {
    return null;
  }

  try {
    // 1. Batches
    const { data: batchesRaw, error: batchesErr } = await supabase
      .from('batches')
      .select('*')
      .eq('institute_id', instituteId)
      .order('created_at', { ascending: true });

    if (batchesErr) console.error('Error fetching batches from Supabase:', batchesErr);

    // 2. Students (joining batch details)
    const { data: studentsRaw, error: studentsErr } = await supabase
      .from('students')
      .select('*, batches(id, name, course)')
      .eq('institute_id', instituteId)
      .order('created_at', { ascending: true });

    if (studentsErr) console.error('Error fetching students from Supabase:', studentsErr);

    const students = (studentsRaw || []).map(mapStudentFromDb);

    // Compute live enrolled student count per batch
    const batches = (batchesRaw || []).map(b => {
      const count = students.filter(s => s.batchId === b.id && s.status === 'active').length;
      return mapBatchFromDb(b, count);
    });

    // 3. Fee Plans
    const { data: plansRaw, error: plansErr } = await supabase
      .from('fee_plans')
      .select('*')
      .eq('institute_id', instituteId)
      .order('created_at', { ascending: true });

    if (plansErr) console.error('Error fetching fee plans from Supabase:', plansErr);
    const feePlans = (plansRaw || []).map(mapFeePlanFromDb);

    // 4. Payments (joining student and batch names)
    const { data: paymentsRaw, error: paymentsErr } = await supabase
      .from('payments')
      .select('*, students(full_name), batches(name)')
      .eq('institute_id', instituteId)
      .order('created_at', { ascending: false });

    if (paymentsErr) console.error('Error fetching payments from Supabase:', paymentsErr);
    const payments = (paymentsRaw || []).map(mapPaymentFromDb);

    // 5. Attendance Sessions
    const { data: sessionsRaw, error: sessionsErr } = await supabase
      .from('attendance_sessions')
      .select('*, profiles(full_name)')
      .eq('institute_id', instituteId)
      .order('session_date', { ascending: false });

    if (sessionsErr) console.error('Error fetching attendance sessions from Supabase:', sessionsErr);
    const attendanceSessions = (sessionsRaw || []).map(mapAttendanceSessionFromDb);

    // 6. Attendance Records
    const { data: recordsRaw, error: recordsErr } = await supabase
      .from('attendance_records')
      .select('*, students(full_name), attendance_sessions(batch_id, session_date)')
      .eq('institute_id', instituteId)
      .order('marked_at', { ascending: false })
      .limit(500);

    if (recordsErr) console.error('Error fetching attendance records from Supabase:', recordsErr);
    const attendance = (recordsRaw || []).map(mapAttendanceRecordFromDb);

    // 7. Memberships / Staff (joining profiles)
    const { data: membersRaw, error: membersErr } = await supabase
      .from('memberships')
      .select('*, profiles(id, full_name, email, phone)')
      .eq('institute_id', instituteId)
      .order('created_at', { ascending: true });

    if (membersErr) console.error('Error fetching staff memberships from Supabase:', membersErr);
    const staff = (membersRaw || []).map(mapStaffFromDb);

    // 8. Audit Logs
    const { data: logsRaw, error: logsErr } = await supabase
      .from('audit_logs')
      .select('*, profiles(full_name)')
      .eq('institute_id', instituteId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (logsErr) console.error('Error fetching audit logs from Supabase:', logsErr);
    const auditLogs = (logsRaw || []).map(mapAuditLogFromDb);

    // 9. Commercial Subscriptions
    const { data: subRaw, error: subErr } = await supabase
      .from('commercial_subscriptions')
      .select('*')
      .eq('institute_id', instituteId)
      .maybeSingle();

    if (subErr) console.error('Error fetching commercial subscription from Supabase:', subErr);

    const commercialSubscription: CommercialSubscription = subRaw
      ? mapCommercialSubFromDb(subRaw)
      : {
          id: `COMM-${instituteId.slice(0, 8)}`,
          instituteId,
          modelType: 'saas_subscription' as const,
          planName: 'Growth Plan',
          status: 'active' as const,
          subscriptionStatus: 'active' as const,
          licenceStatus: 'not_applicable' as const,
          studentLimit: 100,
          enabledModules: ['students', 'batches', 'attendance', 'fees', 'reports', 'staff'],
          hostingResponsibility: 'FIXIA Cloud (AWS Mumbai)',
          supportEntitlement: 'Standard Email & Priority WhatsApp Support',
          sourceCodeOwnership: false,
        };

    // 10. Expenses
    const { data: expensesRaw, error: expensesErr } = await supabase
      .from('expenses')
      .select('*')
      .eq('institute_id', instituteId)
      .order('expense_date', { ascending: false });

    if (expensesErr) console.warn('Note on fetching expenses:', expensesErr.message);
    const expenses = (expensesRaw || []).map(mapExpenseFromDb);

    // 11. Batch Schedules
    const { data: schedulesRaw, error: schedulesErr } = await supabase
      .from('batch_schedules')
      .select('*')
      .eq('institute_id', instituteId)
      .order('day_of_week', { ascending: true });

    if (schedulesErr) console.warn('Note on fetching schedules:', schedulesErr.message);
    const batchSchedules = (schedulesRaw || []).map(mapScheduleFromDb);

    // 12. Student Batch Transfers
    const { data: transfersRaw, error: transfersErr } = await supabase
      .from('student_batch_transfers')
      .select('*, students(full_name)')
      .eq('institute_id', instituteId)
      .order('created_at', { ascending: false });

    if (transfersErr) console.warn('Note on fetching transfers:', transfersErr.message);
    const batchTransfers = (transfersRaw || []).map(mapTransferFromDb);

    return {
      students,
      batches,
      attendance,
      attendanceSessions,
      payments,
      feePlans,
      staff,
      auditLogs,
      commercialSubscription,
      expenses,
      batchSchedules,
      batchTransfers,
    };
  } catch (error) {
    console.error('Fatal error loading institute data from Supabase:', error);
    return null;
  }
}

// ==============================================================================
// 3. Database Mutations (CREATE, UPDATE, DELETE)
// ==============================================================================

/**
 * Creates a student record in PostgreSQL.
 * Trigger trg_check_student_quota validates capacity quota at database kernel level.
 */
export async function dbCreateStudent(instituteId: string, studentData: Partial<Student>): Promise<Student | null> {
  if (!isSupabaseConfigured) return null;

  const payload = mapStudentToDb(studentData, instituteId);
  const { data, error } = await supabase
    .from('students')
    .insert(payload)
    .select('*, batches(id, name, course)')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapStudentFromDb(data);
}

export async function dbUpdateStudent(
  instituteId: string,
  studentId: string,
  updates: Partial<Student>
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  const payload = mapStudentToDb(updates, instituteId);
  delete payload.institute_id; // prevent immutability trigger conflict

  const { error } = await supabase
    .from('students')
    .update(payload)
    .eq('id', studentId)
    .eq('institute_id', instituteId);

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

export async function dbDeleteStudent(instituteId: string, studentId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', studentId)
    .eq('institute_id', instituteId);

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

export async function dbCreateBatch(instituteId: string, batchData: Partial<Batch>): Promise<Batch | null> {
  if (!isSupabaseConfigured) return null;

  const payload = mapBatchToDb(batchData, instituteId);
  const { data, error } = await supabase
    .from('batches')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapBatchFromDb(data, 0);
}

export async function dbUpdateBatch(
  instituteId: string,
  batchId: string,
  updates: Partial<Batch>
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  const payload = mapBatchToDb(updates, instituteId);
  delete payload.institute_id;

  const { error } = await supabase
    .from('batches')
    .update(payload)
    .eq('id', batchId)
    .eq('institute_id', instituteId);

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

export async function dbDeleteBatch(instituteId: string, batchId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  const { error } = await supabase
    .from('batches')
    .delete()
    .eq('id', batchId)
    .eq('institute_id', instituteId);

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

/**
 * Saves a daily attendance roll session and all individual student records.
 */
export async function dbSaveAttendanceSession(
  instituteId: string,
  input: SaveAttendanceSessionInput,
  currentUserId: string
): Promise<{ session: AttendanceSession; records: DailyAttendanceRecord[] } | null> {
  if (!isSupabaseConfigured) return null;

  const total = input.records.length;
  const present = input.records.filter(r => r.status === 'present').length;
  const absent = input.records.filter(r => r.status === 'absent').length;
  const late = input.records.filter(r => r.status === 'late').length;

  // 1. Upsert session row
  const sessionPayload = {
    institute_id: instituteId,
    batch_id: input.batchId,
    session_date: input.date,
    marked_by_user_id: currentUserId && currentUserId.length > 20 ? currentUserId : null,
    total_enrolled: total,
    total_present: present,
    total_absent: absent,
    total_late: late,
    notes: input.notes || null,
  };

  const { data: sessionData, error: sessionErr } = await supabase
    .from('attendance_sessions')
    .upsert(sessionPayload, { onConflict: 'institute_id,batch_id,session_date' })
    .select('*, profiles(full_name)')
    .single();

  if (sessionErr) throw new Error(sessionErr.message);

  const mappedSession = mapAttendanceSessionFromDb(sessionData);

  // 2. Upsert individual student attendance records
  const recordsPayload = input.records.map(r => ({
    institute_id: instituteId,
    session_id: mappedSession.id,
    student_id: r.studentId,
    status: r.status,
    remarks: r.remarks || null,
  }));

  const { data: recordsData, error: recordsErr } = await supabase
    .from('attendance_records')
    .upsert(recordsPayload, { onConflict: 'session_id,student_id' })
    .select('*, students(full_name)');

  if (recordsErr) throw new Error(recordsErr.message);

  const mappedRecords = (recordsData || []).map(mapAttendanceRecordFromDb);

  return { session: mappedSession, records: mappedRecords };
}

/**
 * Records a financial fee payment transaction and updates student ledger balances.
 */
export async function dbRecordPayment(
  instituteId: string,
  paymentData: Partial<PaymentTransaction>,
  student: Student
): Promise<PaymentTransaction | null> {
  if (!isSupabaseConfigured) return null;

  const paymentPayload = mapPaymentToDb(paymentData, instituteId);

  // 1. Insert payment record
  const { data: txnData, error: txnErr } = await supabase
    .from('payments')
    .insert(paymentPayload)
    .select('*, students(full_name), batches(name)')
    .single();

  if (txnErr) throw new Error(txnErr.message);

  // 2. Update student ledger in PostgreSQL
  const newTotalPaid = student.totalFeePaid + (paymentData.amount || 0);
  const newBalance = Math.max(0, student.totalFeeInvoiced - newTotalPaid);
  const newFeeStatus: FeeStatus = newBalance === 0 ? 'paid' : newTotalPaid > 0 ? 'partial' : 'overdue';

  await supabase
    .from('students')
    .update({
      total_fee_paid: newTotalPaid,
      balance_fee: newBalance,
      fee_status: newFeeStatus,
      last_payment_date: paymentData.paymentDate || new Date().toISOString().split('T')[0],
    })
    .eq('id', student.id)
    .eq('institute_id', instituteId);

  return mapPaymentFromDb(txnData);
}

/**
 * Reverses a payment with an auditable reason and restores student ledger balances.
 */
export async function dbReversePayment(
  instituteId: string,
  payment: PaymentTransaction,
  reason: string,
  currentUserId: string,
  student: Student
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  // 1. Update payment status to 'reversed'
  const { error: txnErr } = await supabase
    .from('payments')
    .update({
      status: 'reversed',
      reversal_reason: reason,
      reversed_at: new Date().toISOString(),
      reversed_by_user_id: currentUserId && currentUserId.length > 20 ? currentUserId : null,
    })
    .eq('id', payment.id)
    .eq('institute_id', instituteId);

  if (txnErr) throw new Error(txnErr.message);

  // 2. Restore student balances in PostgreSQL
  const newTotalPaid = Math.max(0, student.totalFeePaid - payment.amount);
  const newBalance = Math.max(0, student.totalFeeInvoiced - newTotalPaid);
  const newFeeStatus: FeeStatus = newBalance === 0 ? 'paid' : newTotalPaid > 0 ? 'partial' : 'overdue';

  await supabase
    .from('students')
    .update({
      total_fee_paid: newTotalPaid,
      balance_fee: newBalance,
      fee_status: newFeeStatus,
    })
    .eq('id', student.id)
    .eq('institute_id', instituteId);

  return true;
}

export async function dbCreateFeePlan(instituteId: string, planData: Partial<FeePlan>): Promise<FeePlan | null> {
  if (!isSupabaseConfigured) return null;

  const payload = mapFeePlanToDb(planData, instituteId);
  const { data, error } = await supabase
    .from('fee_plans')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw new Error(error.message);

  return mapFeePlanFromDb(data);
}

export async function dbLogAuditEvent(
  instituteId: string,
  currentUserId: string,
  action: string,
  entityType: string,
  entityId: string,
  details?: Record<string, any>
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  const { error } = await supabase.from('audit_logs').insert({
    institute_id: instituteId,
    user_id: currentUserId && currentUserId.length > 20 ? currentUserId : null,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details: details || {},
  });

  if (error) {
    console.warn('Audit log insert failed:', error);
    return false;
  }

  return true;
}

export async function dbUpdateCommercialSubscription(
  instituteId: string,
  updates: Partial<CommercialSubscription>
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  const dbUpdates: any = {};
  if (updates.modelType !== undefined) dbUpdates.model_type = updates.modelType;
  if (updates.planName !== undefined) dbUpdates.plan_name = updates.planName;
  if (updates.subscriptionStatus !== undefined) dbUpdates.subscription_status = updates.subscriptionStatus;
  if (updates.licenceStatus !== undefined) dbUpdates.licence_status = updates.licenceStatus;
  if (updates.studentLimit !== undefined) dbUpdates.student_limit = updates.studentLimit;
  if (updates.enabledModules !== undefined) dbUpdates.enabled_modules = updates.enabledModules;
  if (updates.recurringAmount !== undefined) dbUpdates.recurring_amount = updates.recurringAmount;
  if (updates.renewalDate !== undefined) dbUpdates.renewal_date = updates.renewalDate;
  if (updates.licenceKey !== undefined) dbUpdates.licence_key = updates.licenceKey;
  if (updates.maintenanceResponsibility !== undefined) dbUpdates.maintenance_responsibility = updates.maintenanceResponsibility;
  if (updates.customRequirements !== undefined) dbUpdates.custom_requirements = updates.customRequirements;
  if (updates.quotationReference !== undefined) dbUpdates.quotation_reference = updates.quotationReference;
  if (updates.quotationAmount !== undefined) dbUpdates.quotation_amount = updates.quotationAmount;
  if (updates.definedScope !== undefined) dbUpdates.defined_scope = updates.definedScope;
  if (updates.milestoneStatus !== undefined) dbUpdates.milestone_status = updates.milestoneStatus;
  if (updates.supportAgreement !== undefined) dbUpdates.support_agreement = updates.supportAgreement;

  const { error } = await supabase
    .from('commercial_subscriptions')
    .update(dbUpdates)
    .eq('institute_id', instituteId);

  if (error) throw new Error(error.message);

  return true;
}

// ==============================================================================
// 4. Expenses Mutations & Queries
// ==============================================================================

export async function fetchExpenses(instituteId: string): Promise<Expense[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('institute_id', instituteId)
    .order('expense_date', { ascending: false });

  if (error) {
    console.warn('fetchExpenses failed:', error.message);
    return [];
  }

  return (data || []).map(mapExpenseFromDb);
}

export async function dbCreateExpense(
  instituteId: string,
  expenseData: Partial<Expense>,
  currentUserId?: string
): Promise<Expense | null> {
  if (!isSupabaseConfigured) return null;

  const payload = mapExpenseToDb(expenseData, instituteId);
  if (currentUserId && currentUserId.length > 20) {
    payload.created_by = currentUserId;
  }

  const { data, error } = await supabase
    .from('expenses')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw new Error(error.message);

  return mapExpenseFromDb(data);
}

export async function dbVoidExpense(
  instituteId: string,
  expenseId: string,
  reason: string,
  currentUserId?: string
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  const { error } = await supabase
    .from('expenses')
    .update({
      is_voided: true,
      voided_at: new Date().toISOString(),
      void_reason: reason,
      voided_by: currentUserId && currentUserId.length > 20 ? currentUserId : null,
    })
    .eq('id', expenseId)
    .eq('institute_id', instituteId);

  if (error) throw new Error(error.message);

  return true;
}

// ==============================================================================
// 5. Batch Schedules & Timetable Queries & Mutations
// ==============================================================================

export async function fetchBatchSchedules(instituteId: string, batchId?: string): Promise<BatchSchedule[]> {
  if (!isSupabaseConfigured) return [];

  let query = supabase
    .from('batch_schedules')
    .select('*')
    .eq('institute_id', instituteId);

  if (batchId) {
    query = query.eq('batch_id', batchId);
  }

  const { data, error } = await query.order('day_of_week', { ascending: true });

  if (error) {
    console.warn('fetchBatchSchedules failed:', error.message);
    return [];
  }

  return (data || []).map(mapScheduleFromDb);
}

export async function dbCreateBatchSchedule(
  instituteId: string,
  scheduleData: Partial<BatchSchedule>
): Promise<BatchSchedule | null> {
  if (!isSupabaseConfigured) return null;

  const payload = mapScheduleToDb(scheduleData, instituteId);
  const { data, error } = await supabase
    .from('batch_schedules')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw new Error(error.message);

  return mapScheduleFromDb(data);
}

export async function dbDeleteBatchSchedule(instituteId: string, scheduleId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  const { error } = await supabase
    .from('batch_schedules')
    .delete()
    .eq('id', scheduleId)
    .eq('institute_id', instituteId);

  if (error) throw new Error(error.message);

  return true;
}

// ==============================================================================
// 6. Student Batch Transfers & Historical Roster Queries
// ==============================================================================

export async function fetchStudentBatchTransfers(
  instituteId: string,
  studentId?: string
): Promise<StudentBatchTransfer[]> {
  if (!isSupabaseConfigured) return [];

  let query = supabase
    .from('student_batch_transfers')
    .select('*, students(full_name)')
    .eq('institute_id', instituteId);

  if (studentId) {
    query = query.eq('student_id', studentId);
  }

  const { data, error } = await query.order('transfer_date', { ascending: false });

  if (error) {
    console.warn('fetchStudentBatchTransfers failed:', error.message);
    return [];
  }

  return (data || []).map(mapTransferFromDb);
}

export async function dbTransferStudentBatch(
  instituteId: string,
  studentId: string,
  newBatchId: string,
  reason?: string
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  const { error } = await supabase.rpc('transfer_student_batch', {
    p_institute_id: instituteId,
    p_student_id: studentId,
    p_new_batch_id: newBatchId,
    p_reason: reason || null,
  });

  if (error) {
    // Fallback if stored procedure not yet applied to database
    const { error: fallbackErr } = await supabase
      .from('students')
      .update({ batch_id: newBatchId })
      .eq('id', studentId)
      .eq('institute_id', instituteId);

    if (fallbackErr) throw new Error(fallbackErr.message);
  }

  return true;
}

// ==============================================================================
// 7. Teacher Assigned Batches & Sandboxed Roaster
// ==============================================================================

export async function fetchTeacherBatches(instituteId: string, teacherUserId: string): Promise<Batch[]> {
  if (!isSupabaseConfigured) return [];

  // RLS on batches natively returns ONLY batches assigned to this teacher
  const { data, error } = await supabase
    .from('batches')
    .select('*')
    .eq('institute_id', instituteId)
    .order('name', { ascending: true });

  if (error) {
    console.warn('fetchTeacherBatches failed:', error.message);
    return [];
  }

  return (data || []).map(b => mapBatchFromDb(b, 0));
}

// ==============================================================================
// 8. Staff Provisioning & Management via Stored Procedures
// ==============================================================================

export async function dbCreateStaffMember(
  instituteId: string,
  email: string,
  fullName: string,
  role: string = 'teacher',
  assignedBatches: string[] = []
): Promise<string | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase.rpc('create_staff_member', {
    p_institute_id: instituteId,
    p_email: email.toLowerCase().trim(),
    p_full_name: fullName.trim(),
    p_role: role,
    p_assigned_batches: assignedBatches,
  });

  if (error) throw new Error(error.message);

  return data as string;
}

export async function dbDeactivateStaffMember(
  instituteId: string,
  userId: string
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  const { error } = await supabase.rpc('deactivate_staff_member', {
    p_institute_id: instituteId,
    p_user_id: userId,
  });

  if (error) throw new Error(error.message);

  return true;
}

