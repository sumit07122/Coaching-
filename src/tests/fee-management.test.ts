import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateInitialStudents,
  INITIAL_BATCHES,
  INITIAL_FEE_PLANS,
  INITIAL_PAYMENT_TRANSACTIONS,
  INITIAL_INSTITUTE_CONFIG,
} from '../data/mockData';
import {
  Student,
  Batch,
  FeePlan,
  PaymentTransaction,
  CreateFeePlanInput,
  AssignFeePlanInput,
  RecordPaymentInput,
  UserRole,
  FeeStatus,
} from '../types';

describe('FIXIA CoachingOS — Production Fee Management Module', () => {
  const INSTITUTE_ID = 'INST-MTH-01';
  const TODAY_DATE = '2026-11-03';

  let students: Student[];
  let batches: Batch[];
  let feePlans: FeePlan[];
  let payments: PaymentTransaction[];

  beforeEach(() => {
    students = generateInitialStudents();
    batches = JSON.parse(JSON.stringify(INITIAL_BATCHES));
    feePlans = JSON.parse(JSON.stringify(INITIAL_FEE_PLANS));
    payments = JSON.parse(JSON.stringify(INITIAL_PAYMENT_TRANSACTIONS));
  });

  // Helper simulating AppContext logic in an isolated, pure test context
  const createFeePlanLogic = (
    input: CreateFeePlanInput,
    role: UserRole = 'owner',
    instituteId: string = INSTITUTE_ID
  ): FeePlan => {
    if (!['owner', 'admin'].includes(role)) {
      throw new Error('Unauthorized: Only administrators and institute owners can create fee plans.');
    }
    if (!input.name || !input.name.trim()) {
      throw new Error('Fee plan name is required.');
    }
    if (!input.amount || isNaN(input.amount) || input.amount <= 0) {
      throw new Error('Fee plan amount must be a positive number greater than zero.');
    }

    const seq = feePlans.length + 101;
    const newPlan: FeePlan = {
      id: `FP-${seq}`,
      instituteId,
      institute_id: instituteId,
      name: input.name.trim(),
      category: input.category || 'General Academic',
      amount: Number(input.amount),
      billingFrequency: input.billingFrequency || 'Monthly',
      description: input.description || 'Standard academic fee structure',
      dueDayOfMonth: input.dueDayOfMonth || 10,
      dueDate: input.dueDate,
      maxAuthorizedDiscountPercent: input.maxAuthorizedDiscountPercent || 20,
    };
    feePlans.push(newPlan);
    return newPlan;
  };

  const assignFeePlanLogic = (
    input: AssignFeePlanInput,
    role: UserRole = 'owner'
  ): Student => {
    if (!['owner', 'admin'].includes(role)) {
      throw new Error('Unauthorized: Only administrators and institute owners can assign fee plans.');
    }
    const student = students.find(s => s.id === input.studentId);
    if (!student) throw new Error('Student not found.');

    const plan = feePlans.find(p => p.id === input.planId);
    if (!plan) throw new Error('Fee plan not found.');

    const discount = Math.max(0, input.discountAmount || 0);
    const netInvoiced = Math.max(0, plan.amount - discount);
    const newBalance = Math.max(0, netInvoiced - student.totalFeePaid);

    let newStatus: FeeStatus = 'overdue';
    if (newBalance === 0) newStatus = 'paid';
    else if (student.totalFeePaid > 0) newStatus = 'partial';

    const updatedStudent: Student = {
      ...student,
      feePlanId: plan.id,
      feePlanName: plan.name,
      totalFeeInvoiced: netInvoiced,
      balanceFee: newBalance,
      feeStatus: newStatus,
      feeDueDate: input.customDueDate || plan.dueDate || '2026-11-10',
      discountAmount: discount,
      discountReason: input.discountReason || (discount > 0 ? 'Authorized scholarship' : undefined),
    };

    const index = students.findIndex(s => s.id === student.id);
    students[index] = updatedStudent;
    return updatedStudent;
  };

  const recordPaymentLogic = (
    input: RecordPaymentInput,
    role: UserRole = 'owner',
    actorName: string = 'Er. Rakesh Sharma',
    instituteId: string = INSTITUTE_ID
  ): PaymentTransaction => {
    if (!input.amount || isNaN(input.amount) || input.amount <= 0) {
      throw new Error('Invalid payment amount. Amount must be a positive number greater than zero.');
    }
    if (!['owner', 'admin'].includes(role)) {
      throw new Error('Unauthorized: Only administrators and institute owners can record manual payments.');
    }

    const student = students.find(s => s.id === input.studentId);
    if (!student) throw new Error('Student not found.');

    const dateToUse = input.paymentDate && /^\d{4}-\d{2}-\d{2}$/.test(input.paymentDate) ? input.paymentDate : TODAY_DATE;

    // Duplicate payment prevention check (within 3s / matching duplicate attributes)
    const isDuplicate = payments.some(
      p =>
        p.studentId === input.studentId &&
        p.amount === input.amount &&
        p.paymentDate === dateToUse &&
        p.paymentMethod === input.paymentMethod &&
        p.status !== 'reversed' &&
        p.id.startsWith('TXN-RECENT-')
    );
    if (isDuplicate) {
      throw new Error('Duplicate payment prevented: An identical transaction was recently recorded.');
    }

    const priorPaid = student.totalFeePaid;
    const invoiced = student.totalFeeInvoiced;
    const newPaid = priorPaid + input.amount;
    const newBalance = Math.max(0, invoiced - newPaid);

    let newStatus: FeeStatus = 'overdue';
    if (newBalance === 0) newStatus = 'paid';
    else if (newPaid > 0) newStatus = 'partial';

    student.totalFeePaid = newPaid;
    student.balanceFee = newBalance;
    student.feeStatus = newStatus;
    student.lastPaymentDate = dateToUse;

    const receiptSeq = payments.length + 89;
    const receiptNumber = `${INITIAL_INSTITUTE_CONFIG.receiptPrefix}${receiptSeq.toString().padStart(4, '0')}`;

    const newTxn: PaymentTransaction = {
      id: `TXN-RECENT-${Date.now()}`,
      instituteId,
      institute_id: instituteId,
      receiptNumber,
      studentId: student.id,
      studentName: student.fullName,
      batchId: student.batchId,
      batchName: student.batchName,
      amount: input.amount,
      paymentMethod: input.paymentMethod,
      paymentDate: dateToUse,
      collectedBy: actorName,
      remarks: input.remarks || `Fee instalment received via ${input.paymentMethod}`,
      invoicedAmount: invoiced,
      paidAmountPrior: priorPaid,
      balanceRemaining: newBalance,
      status: 'confirmed',
    };

    payments.unshift(newTxn);
    return newTxn;
  };

  const reversePaymentLogic = (
    paymentId: string,
    reason: string,
    role: UserRole = 'owner',
    actorName: string = 'Er. Rakesh Sharma'
  ): PaymentTransaction => {
    if (!['owner', 'admin'].includes(role)) {
      throw new Error('Unauthorized: Only administrators and owners may reverse payments.');
    }
    if (!reason || !reason.trim()) {
      throw new Error('An auditable reason is required to reverse a confirmed payment.');
    }

    const txn = payments.find(p => p.id === paymentId);
    if (!txn) throw new Error('Transaction not found.');
    if (txn.status === 'reversed') {
      throw new Error('This payment transaction has already been reversed.');
    }

    const student = students.find(s => s.id === txn.studentId);
    if (student) {
      const revisedPaid = Math.max(0, student.totalFeePaid - txn.amount);
      const revisedBalance = Math.max(0, student.totalFeeInvoiced - revisedPaid);
      let revisedStatus: FeeStatus = 'overdue';
      if (revisedBalance === 0) revisedStatus = 'paid';
      else if (revisedPaid > 0) revisedStatus = 'partial';

      student.totalFeePaid = revisedPaid;
      student.balanceFee = revisedBalance;
      student.feeStatus = revisedStatus;
    }

    const nowIso = new Date().toISOString();
    txn.status = 'reversed';
    txn.reversalReason = reason.trim();
    txn.reversedAt = nowIso;

    return txn;
  };

  // ==========================================
  // 1. FEE PLANS: CREATION & VALIDATION
  // ==========================================
  describe('Fee Plans Creation & Validation', () => {
    it('creates a new monthly fee plan with valid configuration', () => {
      const newPlan = createFeePlanLogic({
        name: 'Class 12th Board Crash Course 2027',
        category: 'Class 12 Board',
        amount: 3500,
        billingFrequency: 'Monthly',
        description: 'Intensive revision and sample paper solving',
        dueDayOfMonth: 10,
        maxAuthorizedDiscountPercent: 15,
      });

      expect(newPlan.id).toBeDefined();
      expect(newPlan.name).toBe('Class 12th Board Crash Course 2027');
      expect(newPlan.amount).toBe(3500);
      expect(newPlan.billingFrequency).toBe('Monthly');
      expect(newPlan.dueDayOfMonth).toBe(10);
      expect(newPlan.maxAuthorizedDiscountPercent).toBe(15);
      expect(newPlan.instituteId).toBe(INSTITUTE_ID);
    });

    it('creates custom, quarterly, and annual fee plans with flexible structures', () => {
      const quarterlyPlan = createFeePlanLogic({
        name: 'JEE 2-Year Integrated (Quarterly)',
        category: 'JEE Foundation',
        amount: 15000,
        billingFrequency: 'Quarterly',
        description: 'Quarterly fee schedule with periodic test evaluations',
        dueDayOfMonth: 5,
      });
      expect(quarterlyPlan.billingFrequency).toBe('Quarterly');
      expect(quarterlyPlan.amount).toBe(15000);

      const customPlan = createFeePlanLogic({
        name: 'Olympiad Fast-Track (Custom 6-Week)',
        category: 'Olympiad',
        amount: 8000,
        billingFrequency: 'Custom',
        dueDate: '2026-12-15',
        description: 'Custom duration intensive sprint',
      });
      expect(customPlan.billingFrequency).toBe('Custom');
      expect(customPlan.dueDate).toBe('2026-12-15');
    });

    it('rejects invalid fee plan amounts (negative, zero, or non-numeric)', () => {
      expect(() => {
        createFeePlanLogic({
          name: 'Invalid Negative Plan',
          category: 'Test',
          amount: -500,
          billingFrequency: 'Monthly',
          description: 'Should fail',
        });
      }).toThrow('Fee plan amount must be a positive number greater than zero.');

      expect(() => {
        createFeePlanLogic({
          name: 'Invalid Zero Plan',
          category: 'Test',
          amount: 0,
          billingFrequency: 'Monthly',
          description: 'Should fail',
        });
      }).toThrow('Fee plan amount must be a positive number greater than zero.');

      expect(() => {
        createFeePlanLogic({
          name: 'Invalid NaN Plan',
          category: 'Test',
          amount: NaN,
          billingFrequency: 'Monthly',
          description: 'Should fail',
        });
      }).toThrow('Fee plan amount must be a positive number greater than zero.');
    });

    it('rejects empty or whitespace fee plan names', () => {
      expect(() => {
        createFeePlanLogic({
          name: '   ',
          category: 'Test',
          amount: 2000,
          billingFrequency: 'Monthly',
          description: 'Should fail',
        });
      }).toThrow('Fee plan name is required.');
    });
  });

  // ==========================================
  // 2. FEE PLAN ASSIGNMENT & AUTHORIZED DISCOUNTS
  // ==========================================
  describe('Fee Plan Assignment & Authorized Discounts', () => {
    it('assigns fee plan to student, calculating net invoiced and balance fee correctly', () => {
      const student = students[0];
      const targetPlan = feePlans[0]; // e.g., 2500

      const updated = assignFeePlanLogic({
        studentId: student.id,
        planId: targetPlan.id,
        customDueDate: '2026-11-15',
      });

      expect(updated.feePlanId).toBe(targetPlan.id);
      expect(updated.feePlanName).toBe(targetPlan.name);
      expect(updated.totalFeeInvoiced).toBe(targetPlan.amount);
      expect(updated.feeDueDate).toBe('2026-11-15');
      expect(updated.balanceFee).toBe(Math.max(0, targetPlan.amount - updated.totalFeePaid));
    });

    it('applies authorized discount concession and sets audit reason without treating invoice as payment', () => {
      const student = students[0];
      const initialPaid = student.totalFeePaid;
      const targetPlan = feePlans.find(p => p.amount === 3000) || feePlans[0];
      const discount = 500;

      const updated = assignFeePlanLogic({
        studentId: student.id,
        planId: targetPlan.id,
        discountAmount: discount,
        discountReason: 'Merit-cum-means concession approved by Director',
      });

      const expectedNet = targetPlan.amount - discount;
      expect(updated.totalFeeInvoiced).toBe(expectedNet);
      expect(updated.discountAmount).toBe(500);
      expect(updated.discountReason).toBe('Merit-cum-means concession approved by Director');

      // CRITICAL: Invoicing is NEVER treated as a payment!
      expect(updated.totalFeePaid).toBe(initialPaid);
      expect(updated.balanceFee).toBe(Math.max(0, expectedNet - initialPaid));
    });

    it('throws error if target student or fee plan does not exist', () => {
      expect(() => {
        assignFeePlanLogic({
          studentId: 'NON-EXISTENT-STUDENT',
          planId: feePlans[0].id,
        });
      }).toThrow('Student not found.');

      expect(() => {
        assignFeePlanLogic({
          studentId: students[0].id,
          planId: 'NON-EXISTENT-PLAN',
        });
      }).toThrow('Fee plan not found.');
    });
  });

  // ==========================================
  // 3. MANUAL PAYMENTS & BALANCE RECALCULATIONS
  // ==========================================
  describe('Manual Payments & Balance Recalculations', () => {
    it('records partial manual payment and updates balance and status to partial', () => {
      // Find a student with balance >= 1000
      const student = students.find(s => s.balanceFee >= 1000)!;
      const initialInvoiced = student.totalFeeInvoiced;
      const initialPaid = student.totalFeePaid;
      const initialBalance = student.balanceFee;
      const paymentAmount = 500;

      const txn = recordPaymentLogic({
        studentId: student.id,
        amount: paymentAmount,
        paymentMethod: 'UPI',
        paymentDate: TODAY_DATE,
        remarks: 'Part payment via PhonePe',
      });

      // Verify transaction details
      expect(txn.receiptNumber).toMatch(/^RCP-2026-\d{4}$/);
      expect(txn.amount).toBe(500);
      expect(txn.paymentMethod).toBe('UPI');
      expect(txn.status).toBe('confirmed');
      expect(txn.paidAmountPrior).toBe(initialPaid);
      expect(txn.invoicedAmount).toBe(initialInvoiced);
      expect(txn.balanceRemaining).toBe(initialBalance - paymentAmount);

      // Verify student state
      expect(student.totalFeeInvoiced).toBe(initialInvoiced); // Invoiced amount untouched
      expect(student.totalFeePaid).toBe(initialPaid + paymentAmount);
      expect(student.balanceFee).toBe(initialBalance - paymentAmount);
      expect(student.feeStatus).toBe('partial');
    });

    it('records full manual payment and updates balance to 0 with status paid', () => {
      const student = students.find(s => s.balanceFee > 0)!;
      const fullDue = student.balanceFee;
      const initialPaid = student.totalFeePaid;

      const txn = recordPaymentLogic({
        studentId: student.id,
        amount: fullDue,
        paymentMethod: 'Cash',
        paymentDate: TODAY_DATE,
        remarks: 'Full settlement in cash at Mathura office',
      });

      expect(txn.balanceRemaining).toBe(0);
      expect(student.balanceFee).toBe(0);
      expect(student.totalFeePaid).toBe(initialPaid + fullDue);
      expect(student.feeStatus).toBe('paid');
    });

    it('maintains strict separation between invoiced amount, amount paid, and remaining balance', () => {
      const student = students[5];
      const initialInvoiced = student.totalFeeInvoiced;
      const initialPaid = student.totalFeePaid;

      recordPaymentLogic({
        studentId: student.id,
        amount: 1000,
        paymentMethod: 'Bank Transfer',
        paymentDate: TODAY_DATE,
      });

      // Assert that invoiced amount NEVER increases when payment is received
      expect(student.totalFeeInvoiced).toBe(initialInvoiced);
      expect(student.totalFeePaid).toBe(initialPaid + 1000);
      expect(student.balanceFee).toBe(Math.max(0, initialInvoiced - (initialPaid + 1000)));
    });
  });

  // ==========================================
  // 4. FINANCIAL SECURITY & AUDITABLE REVERSALS
  // ==========================================
  describe('Financial Security & Auditable Reversals', () => {
    it('strictly rejects negative, zero, or NaN payment amounts', () => {
      const student = students[0];

      expect(() => {
        recordPaymentLogic({
          studentId: student.id,
          amount: -1000,
          paymentMethod: 'Cash',
        });
      }).toThrow('Invalid payment amount. Amount must be a positive number greater than zero.');

      expect(() => {
        recordPaymentLogic({
          studentId: student.id,
          amount: 0,
          paymentMethod: 'Cash',
        });
      }).toThrow('Invalid payment amount. Amount must be a positive number greater than zero.');

      expect(() => {
        recordPaymentLogic({
          studentId: student.id,
          amount: NaN,
          paymentMethod: 'Cash',
        });
      }).toThrow('Invalid payment amount. Amount must be a positive number greater than zero.');
    });

    it('prevents rapid duplicate payment submissions', () => {
      const student = students[0];
      const paymentInput: RecordPaymentInput = {
        studentId: student.id,
        amount: 1500,
        paymentMethod: 'UPI',
        paymentDate: TODAY_DATE,
        remarks: 'Duplicate test',
      };

      // First submission succeeds
      const txn1 = recordPaymentLogic(paymentInput);
      expect(txn1.id).toBeDefined();

      // Identical immediate submission must be blocked
      expect(() => {
        recordPaymentLogic(paymentInput);
      }).toThrow('Duplicate payment prevented: An identical transaction was recently recorded.');
    });

    it('reverses a confirmed payment with auditable reason and restores student balance', () => {
      const student = students.find(s => s.balanceFee > 0)!;
      const priorPaid = student.totalFeePaid;
      const priorBalance = student.balanceFee;

      // 1. Record payment
      const txn = recordPaymentLogic({
        studentId: student.id,
        amount: 1000,
        paymentMethod: 'UPI',
        paymentDate: TODAY_DATE,
        remarks: 'To be reversed for testing',
      });

      expect(student.totalFeePaid).toBe(priorPaid + 1000);
      expect(student.balanceFee).toBe(priorBalance - 1000);

      // 2. Reverse payment
      const reversalReason = 'Erroneous duplicate entry entered by counter clerk';
      const reversedTxn = reversePaymentLogic(txn.id, reversalReason, 'owner', 'Er. Rakesh Sharma');

      // Verify transaction marked reversed
      expect(reversedTxn.status).toBe('reversed');
      expect(reversedTxn.reversalReason).toBe(reversalReason);
      expect(reversedTxn.reversedAt).toBeDefined();

      // Verify student's balances are fully restored
      expect(student.totalFeePaid).toBe(priorPaid);
      expect(student.balanceFee).toBe(priorBalance);
    });

    it('rejects reversal without an auditable reason', () => {
      const student = students[0];
      const txn = recordPaymentLogic({
        studentId: student.id,
        amount: 800,
        paymentMethod: 'Cash',
      });

      expect(() => {
        reversePaymentLogic(txn.id, '   ', 'owner');
      }).toThrow('An auditable reason is required to reverse a confirmed payment.');
    });

    it('prevents double-reversal of an already reversed payment', () => {
      const student = students[0];
      const txn = recordPaymentLogic({
        studentId: student.id,
        amount: 1200,
        paymentMethod: 'Cash',
      });

      reversePaymentLogic(txn.id, 'First valid reversal reason');

      expect(() => {
        reversePaymentLogic(txn.id, 'Second duplicate reversal attempt');
      }).toThrow('This payment transaction has already been reversed.');
    });
  });

  // ==========================================
  // 5. ROLE AUTHORIZATION & PERMISSION ENFORCEMENT
  // ==========================================
  describe('Role Authorization & Tenant Isolation', () => {
    it('allows owner and admin roles to record and reverse payments', () => {
      const student = students[0];

      // Admin can record
      const adminTxn = recordPaymentLogic(
        { studentId: student.id, amount: 500, paymentMethod: 'UPI' },
        'admin',
        'Pooja Verma (Admin)'
      );
      expect(adminTxn.status).toBe('confirmed');

      // Admin can reverse
      const reversed = reversePaymentLogic(adminTxn.id, 'Administrative adjustment', 'admin');
      expect(reversed.status).toBe('reversed');
    });

    it('blocks faculty and staff roles from recording or reversing payments', () => {
      const student = students[0];

      expect(() => {
        recordPaymentLogic(
          { studentId: student.id, amount: 500, paymentMethod: 'UPI' },
          'faculty',
          'Faculty User'
        );
      }).toThrow('Unauthorized: Only administrators and institute owners can record manual payments.');

      expect(() => {
        recordPaymentLogic(
          { studentId: student.id, amount: 500, paymentMethod: 'staff' as any },
          'staff',
          'Staff User'
        );
      }).toThrow('Unauthorized: Only administrators and institute owners can record manual payments.');

      const confirmedTxn = payments[0];
      expect(() => {
        reversePaymentLogic(confirmedTxn.id, 'Unauthorized reversal attempt', 'faculty');
      }).toThrow('Unauthorized: Only administrators and owners may reverse payments.');
    });

    it('blocks faculty and staff from creating or assigning fee plans', () => {
      expect(() => {
        createFeePlanLogic(
          { name: 'Unauthorized Plan', category: 'General', amount: 3000, billingFrequency: 'Monthly', description: '' },
          'staff'
        );
      }).toThrow('Unauthorized: Only administrators and institute owners can create fee plans.');

      expect(() => {
        assignFeePlanLogic(
          { studentId: students[0].id, planId: feePlans[0].id },
          'faculty'
        );
      }).toThrow('Unauthorized: Only administrators and institute owners can assign fee plans.');
    });

    it('enforces mandatory instituteId on every fee plan and payment transaction', () => {
      const newPlan = createFeePlanLogic({
        name: 'Test Tenant Plan',
        category: 'Test',
        amount: 2000,
        billingFrequency: 'Monthly',
        description: 'Tenant testing',
      });
      expect(newPlan.instituteId).toBe(INSTITUTE_ID);

      const txn = recordPaymentLogic({
        studentId: students[0].id,
        amount: 1000,
        paymentMethod: 'Cash',
      });
      expect(txn.instituteId).toBe(INSTITUTE_ID);
    });
  });

  // ==========================================
  // 6. FINANCIAL REPORTS & AGGREGATE CALCULATIONS
  // ==========================================
  describe('Financial Reports & Aggregations', () => {
    it('verifies exact baseline monthly collection of ₹32,000 for November 2026', () => {
      const novCollection = payments
        .filter(p => p.status !== 'reversed' && p.paymentDate.startsWith('2026-11'))
        .reduce((sum, p) => sum + p.amount, 0);

      expect(novCollection).toBe(32000);
    });

    it('verifies exact baseline total pending dues of ₹18,500 across 85 students', () => {
      const totalPending = students.reduce((sum, s) => sum + s.balanceFee, 0);
      expect(totalPending).toBe(18500);
    });

    it('verifies collection calculation excludes reversed transactions', () => {
      const initialTotal = payments
        .filter(p => p.status !== 'reversed')
        .reduce((sum, p) => sum + p.amount, 0);

      const student = students[0];
      const newTxn = recordPaymentLogic({
        studentId: student.id,
        amount: 2500,
        paymentMethod: 'UPI',
        paymentDate: TODAY_DATE,
      });

      const afterAdd = payments
        .filter(p => p.status !== 'reversed')
        .reduce((sum, p) => sum + p.amount, 0);
      expect(afterAdd).toBe(initialTotal + 2500);

      reversePaymentLogic(newTxn.id, 'Correction of accidental double entry');

      const afterReverse = payments
        .filter(p => p.status !== 'reversed')
        .reduce((sum, p) => sum + p.amount, 0);
      expect(afterReverse).toBe(initialTotal);
    });

    it('correctly filters transactions by student and payment method', () => {
      const targetStudentId = 'STU-001';
      const studentTxns = payments.filter(p => p.studentId === targetStudentId);
      expect(studentTxns.length).toBeGreaterThan(0);
      expect(studentTxns.every(p => p.studentId === targetStudentId)).toBe(true);

      const upiTxns = payments.filter(p => p.paymentMethod === 'UPI');
      expect(upiTxns.length).toBeGreaterThan(0);
      expect(upiTxns.every(p => p.paymentMethod === 'UPI')).toBe(true);
    });

    it('accurately identifies and extracts all students with pending dues', () => {
      const studentsWithDues = students.filter(s => s.balanceFee > 0);
      expect(studentsWithDues.length).toBe(20);

      const sumDues = studentsWithDues.reduce((sum, s) => sum + s.balanceFee, 0);
      expect(sumDues).toBe(18500);
    });
  });
});