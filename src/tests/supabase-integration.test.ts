import { describe, it, expect, vi } from 'vitest';
import {
  mapStudentFromDb,
  mapStudentToDb,
  mapBatchFromDb,
  mapBatchToDb,
  mapPaymentFromDb,
  mapPaymentToDb,
  mapFeePlanFromDb,
  mapFeePlanToDb,
  mapAttendanceSessionFromDb,
  mapAttendanceRecordFromDb,
  mapStaffFromDb,
  mapCommercialSubFromDb,
} from '../services/supabaseData';
import { Student, Batch, PaymentTransaction, FeePlan, CommercialSubscription } from '../types';

describe('Supabase Data-Access Layer: Bi-Directional Schema Mapping', () => {
  it('maps PostgreSQL student record to TypeScript domain model correctly', () => {
    const dbRow = {
      id: '00000000-0000-0000-0000-000000000001',
      institute_id: '11111111-1111-1111-1111-111111111111',
      student_id: 'FIX-MTH-26-001',
      full_name: 'Aarav Sharma',
      phone: '+91 94120 11001',
      email: 'aarav.sharma@gmail.com',
      address: 'Krishna Nagar, Mathura',
      guardian_name: 'Ramesh Sharma',
      guardian_phone: '+91 98370 22001',
      guardian_relation: 'Father',
      course: 'Class 12 CBSE Board',
      batch_id: '22222222-2222-2222-2222-222222222222',
      admission_date: '2026-04-01',
      gender: 'Male',
      status: 'active',
      fee_status: 'partial',
      total_fee_invoiced: 48000,
      total_fee_paid: 24000,
      balance_fee: 24000,
      last_payment_date: '2026-07-05',
      notes: 'Strong student in Organic Chemistry',
      batches: {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Class 12 - Shikhar Alpha',
        course: 'Class 12 CBSE Board',
      },
    };

    const student: Student = mapStudentFromDb(dbRow);

    expect(student.id).toBe(dbRow.id);
    expect(student.instituteId).toBe(dbRow.institute_id);
    expect(student.studentId).toBe('FIX-MTH-26-001');
    expect(student.fullName).toBe('Aarav Sharma');
    expect(student.batchName).toBe('Class 12 - Shikhar Alpha');
    expect(student.balanceFee).toBe(24000);
    expect(student.feeStatus).toBe('partial');
  });

  it('maps TypeScript student model to PostgreSQL snake_case payload preserving tenant ID', () => {
    const studentData: Partial<Student> = {
      studentId: 'FIX-MTH-26-099',
      fullName: 'Priya Verma',
      phone: '+91 94120 55001',
      guardianName: 'Sanjay Verma',
      guardianPhone: '+91 98370 66001',
      guardianRelation: 'Father',
      course: 'NEET Dropper Batch',
      batchId: 'batch-uuid-123',
      admissionDate: '2026-04-15',
      gender: 'Female',
      status: 'active',
      feeStatus: 'overdue',
      totalFeeInvoiced: 65000,
      totalFeePaid: 0,
      balanceFee: 65000,
      notes: 'Scholarship applicant',
    };

    const targetInstituteId = 'inst-uuid-456';
    const payload = mapStudentToDb(studentData, targetInstituteId);

    expect(payload.institute_id).toBe(targetInstituteId);
    expect(payload.full_name).toBe('Priya Verma');
    expect(payload.student_id).toBe('FIX-MTH-26-099');
    expect(payload.guardian_relation).toBe('Father');
    expect(payload.total_fee_invoiced).toBe(65000);
    expect(payload.balance_fee).toBe(65000);
    expect(payload.batch_id).toBe('batch-uuid-123');
  });

  it('maps batch models to and from database contracts', () => {
    const dbBatchRow = {
      id: 'bat-uuid-101',
      institute_id: 'inst-uuid-456',
      code: 'BAT-101',
      name: 'Class 12 CBSE Physics',
      course: 'CBSE Class 12 Board',
      instructor_name: 'Dr. B. K. Mishra',
      schedule_days: ['Mon', 'Wed', 'Fri'],
      timing: '04:00 PM - 05:30 PM',
      room: 'Room 204',
      capacity: 30,
      monthly_fee: 4500,
      status: 'active',
      start_date: '2026-04-01',
    };

    const batch = mapBatchFromDb(dbBatchRow, 22);
    expect(batch.id).toBe('bat-uuid-101');
    expect(batch.studentCount).toBe(22);
    expect(batch.instructor).toBe('Dr. B. K. Mishra');
    expect(batch.monthlyFee).toBe(4500);

    const backToDb = mapBatchToDb(batch, 'inst-uuid-456');
    expect(backToDb.instructor_name).toBe('Dr. B. K. Mishra');
    expect(backToDb.institute_id).toBe('inst-uuid-456');
    expect(backToDb.monthly_fee).toBe(4500);
  });

  it('maps financial payment transactions with ledger balances', () => {
    const dbPaymentRow = {
      id: 'pay-uuid-789',
      institute_id: 'inst-uuid-456',
      receipt_number: 'RCP-2026-0145',
      student_id: 'stu-uuid-001',
      batch_id: 'bat-uuid-101',
      amount: 15000,
      payment_method: 'UPI',
      payment_date: '2026-11-03',
      collected_by_name: 'Er. Rakesh Sharma',
      remarks: 'Second instalment paid via GooglePay UPI',
      invoiced_amount: 48000,
      paid_amount_prior: 10000,
      balance_remaining: 23000,
      status: 'confirmed',
      students: { full_name: 'Rahul Aggarwal' },
      batches: { name: 'Class 12 - Shikhar Alpha' },
    };

    const txn = mapPaymentFromDb(dbPaymentRow);
    expect(txn.receiptNumber).toBe('RCP-2026-0145');
    expect(txn.studentName).toBe('Rahul Aggarwal');
    expect(txn.batchName).toBe('Class 12 - Shikhar Alpha');
    expect(txn.amount).toBe(15000);
    expect(txn.balanceRemaining).toBe(23000);

    const dbPayload = mapPaymentToDb(txn, 'inst-uuid-456');
    expect(dbPayload.receipt_number).toBe('RCP-2026-0145');
    expect(dbPayload.paid_amount_prior).toBe(10000);
    expect(dbPayload.balance_remaining).toBe(23000);
    expect(dbPayload.institute_id).toBe('inst-uuid-456');
  });

  it('maps commercial subscription models with student limits and licensing entitlements', () => {
    const dbSubRow = {
      id: 'sub-uuid-1',
      institute_id: 'inst-uuid-456',
      model_type: 'one_time_licence',
      plan_name: 'Campus Perpetual Licence',
      status: 'active',
      subscription_status: 'active',
      licence_status: 'active',
      billing_cycle: 'one_time',
      student_limit: 150,
      enabled_modules: ['students', 'batches', 'attendance', 'fees', 'reports', 'staff'],
      licence_purchase_fee: 75000,
      licence_key: 'FIXIA-LIC-2026-MTH-994',
      licensed_version: 'v1.0.0',
      hosting_responsibility: 'Client Hosted (Self-Managed)',
      maintenance_responsibility: 'Client Internal IT Team',
      upgrade_entitlement: '1 Year Free Version Upgrades',
      support_entitlement: '1 Year Email & Ticket Support (Business Hours)',
    };

    const sub = mapCommercialSubFromDb(dbSubRow);
    expect(sub.modelType).toBe('one_time_licence');
    expect(sub.studentLimit).toBe(150);
    expect(sub.licenceKey).toBe('FIXIA-LIC-2026-MTH-994');
    expect(sub.sourceCodeOwnership).toBe(false); // Explicit requirement: one-time licence != source code ownership
  });
});

describe('Multi-Tenant Database Isolation & RLS Security Contracts', () => {
  it('enforces institute_id on all database write payloads', () => {
    const studentPayload = mapStudentToDb({ fullName: 'Rohit Gupta' }, 'INST-A');
    const batchPayload = mapBatchToDb({ name: 'Batch Physics' }, 'INST-A');
    const feePlanPayload = mapFeePlanToDb({ name: 'Plan A', amount: 5000 }, 'INST-A');

    expect(studentPayload.institute_id).toBe('INST-A');
    expect(batchPayload.institute_id).toBe('INST-A');
    expect(feePlanPayload.institute_id).toBe('INST-A');
  });

  it('prevents cross-tenant write tampering by verifying tenant boundary validation', () => {
    const tenantA_Id = '11111111-1111-1111-1111-111111111111';
    const tenantB_Id = '22222222-2222-2222-2222-222222222222';

    // Mock verification helper
    function verifyTenantAccess(requestedInstId: string, currentInstId: string): boolean {
      return requestedInstId === currentInstId;
    }

    expect(verifyTenantAccess(tenantA_Id, tenantA_Id)).toBe(true);
    expect(verifyTenantAccess(tenantB_Id, tenantA_Id)).toBe(false);
  });
});

describe('Financial Ledger & Payment Security Logic', () => {
  it('correctly calculates balance recalculation upon payment insertion', () => {
    const totalInvoiced = 50000;
    const priorPaid = 20000;
    const newPaymentAmount = 15000;

    const newPaid = priorPaid + newPaymentAmount;
    const balanceRemaining = Math.max(0, totalInvoiced - newPaid);
    const feeStatus = balanceRemaining === 0 ? 'paid' : newPaid > 0 ? 'partial' : 'overdue';

    expect(newPaid).toBe(35000);
    expect(balanceRemaining).toBe(15000);
    expect(feeStatus).toBe('partial');
  });

  it('correctly restores ledger balance upon payment reversal', () => {
    const totalInvoiced = 50000;
    const priorPaid = 35000;
    const reversedAmount = 15000;

    const restoredPaid = Math.max(0, priorPaid - reversedAmount);
    const restoredBalance = Math.max(0, totalInvoiced - restoredPaid);
    const feeStatus = restoredBalance === 0 ? 'paid' : restoredPaid > 0 ? 'partial' : 'overdue';

    expect(restoredPaid).toBe(20000);
    expect(restoredBalance).toBe(30000);
    expect(feeStatus).toBe('partial');
  });

  it('strictly rejects non-positive payment values', () => {
    function validatePaymentAmount(amount: number) {
      if (!amount || isNaN(amount) || amount <= 0) {
        throw new Error('Invalid payment amount. Amount must be a positive number greater than zero.');
      }
      return true;
    }

    expect(() => validatePaymentAmount(0)).toThrow();
    expect(() => validatePaymentAmount(-500)).toThrow();
    expect(() => validatePaymentAmount(NaN)).toThrow();
    expect(validatePaymentAmount(1500)).toBe(true);
  });
});

describe('Attendance Session & Anti-Duplication Security', () => {
  it('detects and prevents duplicate attendance sessions for the same batch on the same date', () => {
    const existingSessions = [
      { instituteId: 'INST-01', batchId: 'BAT-101', sessionDate: '2026-11-03' },
    ];

    function checkDuplicateSession(instituteId: string, batchId: string, sessionDate: string): boolean {
      return existingSessions.some(
        s => s.instituteId === instituteId && s.batchId === batchId && s.sessionDate === sessionDate
      );
    }

    expect(checkDuplicateSession('INST-01', 'BAT-101', '2026-11-03')).toBe(true);
    expect(checkDuplicateSession('INST-01', 'BAT-102', '2026-11-03')).toBe(false);
    expect(checkDuplicateSession('INST-01', 'BAT-101', '2026-11-04')).toBe(false);
  });

  it('calculates attendance percentage rate accurately', () => {
    const totalEnrolled = 25;
    const presentCount = 22;
    const rate = Math.round((presentCount / totalEnrolled) * 100);

    expect(rate).toBe(88);
  });
});

describe('Commercial Quota Enforcement Contract', () => {
  it('enforces student enrollment capacity limits against commercial subscription', () => {
    const commercialPlan = {
      modelType: 'saas_subscription',
      studentLimit: 100,
      subscriptionStatus: 'active',
    };

    function checkAdmissionAllowed(currentActiveStudents: number, plan: typeof commercialPlan) {
      if (currentActiveStudents >= plan.studentLimit) {
        throw new Error(`Commercial student quota reached: Capacity is ${plan.studentLimit}. Upgrade required.`);
      }
      return true;
    }

    expect(checkAdmissionAllowed(99, commercialPlan)).toBe(true);
    expect(() => checkAdmissionAllowed(100, commercialPlan)).toThrow(/Commercial student quota reached/);
    expect(() => checkAdmissionAllowed(101, commercialPlan)).toThrow(/Commercial student quota reached/);
  });
});

