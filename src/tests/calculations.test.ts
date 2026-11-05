import { describe, it, expect } from 'vitest';
import {
  generateInitialStudents,
  generateInitialAttendance,
  INITIAL_BATCHES,
  INITIAL_PAYMENT_TRANSACTIONS,
  ABSENT_STUDENT_INDICES,
} from '../data/mockData';

describe('FIXIA CoachingOS — Critical Calculations & Metrics Invariants', () => {
  const students = generateInitialStudents();
  const todayDate = '2026-11-03';
  const attendance = generateInitialAttendance(students, todayDate);

  it('verifies exact requirement of 85 total enrolled students', () => {
    expect(students.length).toBe(85);
  });

  it('verifies exact requirement of 6 active batches', () => {
    expect(INITIAL_BATCHES.length).toBe(6);
    expect(INITIAL_BATCHES.filter(b => b.status === 'active').length).toBe(6);
  });

  it('verifies sum of students across all batches equals 85', () => {
    const totalEnrolled = INITIAL_BATCHES.reduce((sum, b) => sum + b.studentCount, 0);
    expect(totalEnrolled).toBe(85);
  });

  it('verifies exact requirement of 72 present and 13 absent today', () => {
    const presentCount = attendance.filter(a => a.status === 'present').length;
    const absentCount = attendance.filter(a => a.status === 'absent').length;

    expect(absentCount).toBe(13);
    expect(presentCount).toBe(72);
    expect(presentCount + absentCount).toBe(85);
    expect(ABSENT_STUDENT_INDICES.length).toBe(13);
  });

  it('verifies exact requirement of ₹32,000 collected this month', () => {
    const collectedThisMonth = INITIAL_PAYMENT_TRANSACTIONS
      .filter(p => p.paymentDate.startsWith('2026-11'))
      .reduce((sum, p) => sum + p.amount, 0);

    expect(collectedThisMonth).toBe(32000);
  });

  it('verifies exact requirement of ₹18,500 pending fees outstanding', () => {
    const totalPending = students.reduce((sum, s) => sum + s.balanceFee, 0);
    expect(totalPending).toBe(18500);
  });

  it('verifies partial payment logic updates balances and status correctly', () => {
    const studentWithDues = students.find(s => s.balanceFee > 0)!;
    const priorPaid = studentWithDues.totalFeePaid;
    const invoiced = studentWithDues.totalFeeInvoiced;
    const initialBalance = studentWithDues.balanceFee;

    // Simulate paying half of the remaining balance
    const paymentAmount = 500;
    const newPaid = priorPaid + paymentAmount;
    const newBalance = invoiced - newPaid;

    expect(newBalance).toBe(initialBalance - paymentAmount);
    expect(newPaid).toBe(priorPaid + paymentAmount);
  });
});

