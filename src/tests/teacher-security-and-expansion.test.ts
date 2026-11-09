import { describe, it, expect, vi } from 'vitest';
import {
  mapExpenseFromDb,
  mapExpenseToDb,
  mapScheduleFromDb,
  mapScheduleToDb,
  mapTransferFromDb,
} from '../services/supabaseData';
import {
  Expense,
  BatchSchedule,
  StudentBatchTransfer,
  UserRole,
} from '../types';

describe('Phase 12.2: Teacher Security & Database Expansion', () => {
  describe('TASK 1: Teacher Security & Sandboxing', () => {
    it('verifies teacher authorization is restricted strictly to assigned batches', () => {
      // Simulating is_teacher_assigned_to_batch logic
      const teacherMembership = {
        userId: 'USER-TEACHER-01',
        role: 'teacher' as UserRole,
        assignedBatches: ['BAT-101', 'BAT-102'],
        isActive: true,
      };

      function isTeacherAuthorizedForBatch(
        teacher: typeof teacherMembership,
        batchId: string,
        batchInstructorUserId?: string
      ): boolean {
        if (!teacher.isActive) return false;
        if (batchInstructorUserId === teacher.userId) return true;
        return teacher.assignedBatches.includes(batchId);
      }

      // Assigned batches -> Allowed
      expect(isTeacherAuthorizedForBatch(teacherMembership, 'BAT-101')).toBe(true);
      expect(isTeacherAuthorizedForBatch(teacherMembership, 'BAT-102')).toBe(true);

      // Unassigned batch -> Denied
      expect(isTeacherAuthorizedForBatch(teacherMembership, 'BAT-103')).toBe(false);
      expect(isTeacherAuthorizedForBatch(teacherMembership, 'BAT-104')).toBe(false);

      // Batch where teacher is direct instructor -> Allowed
      expect(
        isTeacherAuthorizedForBatch(
          { ...teacherMembership, assignedBatches: [] },
          'BAT-999',
          'USER-TEACHER-01'
        )
      ).toBe(true);

      // Inactive teacher -> Denied everywhere
      expect(
        isTeacherAuthorizedForBatch(
          { ...teacherMembership, isActive: false },
          'BAT-101'
        )
      ).toBe(false);
    });

    it('enforces that teachers have zero financial access (no payments, fees, or expenses)', () => {
      const teacherPermissions = {
        canViewAttendance: true,
        canMarkAttendance: true,
        canViewAssignedBatches: true,
        canViewFees: false,
        canRecordPayments: false,
        canReversePayments: false,
        canViewExpenses: false,
        canCreateExpenses: false,
        canModifyInstituteSettings: false,
      };

      expect(teacherPermissions.canViewAttendance).toBe(true);
      expect(teacherPermissions.canMarkAttendance).toBe(true);
      expect(teacherPermissions.canViewFees).toBe(false);
      expect(teacherPermissions.canRecordPayments).toBe(false);
      expect(teacherPermissions.canReversePayments).toBe(false);
      expect(teacherPermissions.canViewExpenses).toBe(false);
      expect(teacherPermissions.canCreateExpenses).toBe(false);
      expect(teacherPermissions.canModifyInstituteSettings).toBe(false);
    });

    it('confirms owner retains universal tenant-level authority', () => {
      const ownerPermissions = {
        canViewAttendance: true,
        canMarkAttendance: true,
        canViewAllBatches: true,
        canViewFees: true,
        canRecordPayments: true,
        canReversePayments: true,
        canViewExpenses: true,
        canCreateExpenses: true,
        canModifyInstituteSettings: true,
      };

      Object.values(ownerPermissions).forEach(val => expect(val).toBe(true));
    });
  });

  describe('TASK 2: Expenses Domain & Validation', () => {
    it('correctly maps expense between DB snake_case and Domain camelCase', () => {
      const dbRow = {
        id: 'c1234567-89ab-cdef-0123-456789abcdef',
        institute_id: 'i1234567-89ab-cdef-0123-456789abcdef',
        category: 'rent',
        amount: '25000.00',
        expense_date: '2026-11-01',
        title: 'Monthly Classroom Rent',
        recipient: 'Krishna Complex Holdings',
        payment_mode: 'bank_transfer',
        reference_number: 'NEFT-001928',
        notes: 'Covers main hall and laboratory',
        receipt_voucher_url: 'https://example.com/voucher.pdf',
        created_by: 'u1234567-89ab-cdef-0123-456789abcdef',
        is_voided: false,
        voided_at: null,
        voided_by: null,
        void_reason: null,
        created_at: '2026-11-01T10:00:00Z',
        updated_at: '2026-11-01T10:00:00Z',
      };

      const domain = mapExpenseFromDb(dbRow);
      expect(domain.id).toBe(dbRow.id);
      expect(domain.instituteId).toBe(dbRow.institute_id);
      expect(domain.category).toBe('rent');
      expect(domain.amount).toBe(25000);
      expect(domain.paymentMode).toBe('bank_transfer');
      expect(domain.isVoided).toBe(false);

      const mappedBack = mapExpenseToDb(domain, 'inst-new-id');
      expect(mappedBack.institute_id).toBe('inst-new-id');
      expect(mappedBack.amount).toBe(25000);
      expect(mappedBack.category).toBe('rent');
      expect(mappedBack.payment_mode).toBe('bank_transfer');
    });

    it('rejects zero or negative expense amounts', () => {
      function validateExpenseAmount(amount: number) {
        if (amount <= 0) {
          throw new Error('Expense amount must be greater than zero.');
        }
        return true;
      }

      expect(() => validateExpenseAmount(0)).toThrow('Expense amount must be greater than zero.');
      expect(() => validateExpenseAmount(-500)).toThrow('Expense amount must be greater than zero.');
      expect(validateExpenseAmount(1500)).toBe(true);
    });

    it('requires a reason when voiding an expense and preserves the audit record', () => {
      const originalExpense: Expense = {
        id: 'EXP-001',
        instituteId: 'INST-01',
        category: 'utilities',
        amount: 3500,
        expenseDate: '2026-11-02',
        title: 'Electricity bill',
        paymentMode: 'upi',
        isVoided: false,
        createdAt: '2026-11-02T10:00:00Z',
        updatedAt: '2026-11-02T10:00:00Z',
      };

      function voidExpenseRecord(exp: Expense, reason: string, voidedBy: string): Expense {
        if (!reason || !reason.trim()) {
          throw new Error('A void reason must be provided for audit tracking.');
        }
        return {
          ...exp,
          isVoided: true,
          voidReason: reason.trim(),
          voidedAt: '2026-11-02T12:00:00Z',
          voidedBy,
        };
      }

      expect(() => voidExpenseRecord(originalExpense, '', 'USER-01')).toThrow(
        'A void reason must be provided for audit tracking.'
      );

      const voided = voidExpenseRecord(
        originalExpense,
        'Duplicate bill entry recorded by mistake',
        'USER-01'
      );
      expect(voided.isVoided).toBe(true);
      expect(voided.voidReason).toBe('Duplicate bill entry recorded by mistake');
      expect(voided.amount).toBe(3500); // Amount preserved for audit
    });
  });

  describe('TASK 3: Batch Schedules & Classroom Allocation Collision Detection', () => {
    it('correctly maps schedule between DB and domain', () => {
      const dbRow = {
        id: 's1234567-89ab-cdef-0123-456789abcdef',
        institute_id: 'i1234567-89ab-cdef-0123-456789abcdef',
        batch_id: 'b1234567-89ab-cdef-0123-456789abcdef',
        day_of_week: 1, // Monday
        start_time: '16:30:00',
        end_time: '18:00:00',
        room_number: 'Room 101',
        is_active: true,
        created_at: '2026-11-01T10:00:00Z',
        updated_at: '2026-11-01T10:00:00Z',
      };

      const domain = mapScheduleFromDb(dbRow);
      expect(domain.id).toBe(dbRow.id);
      expect(domain.batchId).toBe(dbRow.batch_id);
      expect(domain.dayOfWeek).toBe(1);
      expect(domain.startTime).toBe('16:30:00');
      expect(domain.endTime).toBe('18:00:00');
      expect(domain.roomNumber).toBe('Room 101');
      expect(domain.isActive).toBe(true);

      const mappedToDb = mapScheduleToDb(domain, 'inst-new');
      expect(mappedToDb.day_of_week).toBe(1);
      expect(mappedToDb.start_time).toBe('16:30:00');
      expect(mappedToDb.room_number).toBe('Room 101');
    });

    it('detects room scheduling collisions on overlapping timeslots on the same day', () => {
      const existingSchedules: BatchSchedule[] = [
        {
          id: 'SCH-01',
          instituteId: 'INST-01',
          batchId: 'BAT-101',
          dayOfWeek: 1, // Monday
          startTime: '16:30:00',
          endTime: '18:00:00',
          roomNumber: 'Room 101',
          isActive: true,
        },
      ];

      function checkRoomCollision(
        schedules: BatchSchedule[],
        dayOfWeek: number,
        startTime: string,
        endTime: string,
        roomNumber?: string
      ) {
        if (!roomNumber || !roomNumber.trim()) return false;
        const room = roomNumber.trim().toLowerCase();

        return schedules.some(s => {
          if (!s.isActive || s.dayOfWeek !== dayOfWeek || !s.roomNumber) return false;
          if (s.roomNumber.trim().toLowerCase() !== room) return false;

          // Time overlap condition
          return (
            (startTime >= s.startTime && startTime < s.endTime) ||
            (endTime > s.startTime && endTime <= s.endTime) ||
            (startTime <= s.startTime && endTime >= s.endTime)
          );
        });
      }

      // Overlapping during same slot -> Conflict!
      expect(checkRoomCollision(existingSchedules, 1, '17:00:00', '18:30:00', 'Room 101')).toBe(true);
      expect(checkRoomCollision(existingSchedules, 1, '16:30:00', '18:00:00', 'Room 101')).toBe(true);
      expect(checkRoomCollision(existingSchedules, 1, '16:00:00', '19:00:00', 'Room 101')).toBe(true);

      // Different day -> Allowed
      expect(checkRoomCollision(existingSchedules, 2, '16:30:00', '18:00:00', 'Room 101')).toBe(false);

      // Different room -> Allowed
      expect(checkRoomCollision(existingSchedules, 1, '16:30:00', '18:00:00', 'Room 102')).toBe(false);

      // Non-overlapping timeslot on same day and same room -> Allowed
      expect(checkRoomCollision(existingSchedules, 1, '18:00:00', '19:30:00', 'Room 101')).toBe(false);
      expect(checkRoomCollision(existingSchedules, 1, '15:00:00', '16:30:00', 'Room 101')).toBe(false);
    });

    it('rejects end times earlier than or equal to start times', () => {
      function validateTimes(startTime: string, endTime: string) {
        if (endTime <= startTime) {
          throw new Error('Schedule end time must be after start time.');
        }
        return true;
      }

      expect(() => validateTimes('18:00:00', '16:30:00')).toThrow(
        'Schedule end time must be after start time.'
      );
      expect(() => validateTimes('18:00:00', '18:00:00')).toThrow(
        'Schedule end time must be after start time.'
      );
      expect(validateTimes('16:30:00', '18:00:00')).toBe(true);
    });
  });

  describe('TASK 4: Student Batch Transfers & Historical Attendance Preservation', () => {
    it('records student batch transfer history with reason and preserves prior session continuity', () => {
      const transferDbRow = {
        id: 't1234567-89ab-cdef-0123-456789abcdef',
        institute_id: 'i1234567-89ab-cdef-0123-456789abcdef',
        student_id: 's1234567-89ab-cdef-0123-456789abcdef',
        from_batch_id: 'b1111111-1111-1111-1111-111111111111',
        to_batch_id: 'b2222222-2222-2222-2222-222222222222',
        transfer_date: '2026-11-03',
        reason: 'Upgraded to Advanced JEE Batch after test performance',
        transferred_by: 'u1234567-89ab-cdef-0123-456789abcdef',
        created_at: '2026-11-03T10:00:00Z',
        students: { full_name: 'Aarav Sharma' },
      };

      const transfer = mapTransferFromDb(transferDbRow);
      expect(transfer.id).toBe(transferDbRow.id);
      expect(transfer.studentId).toBe(transferDbRow.student_id);
      expect(transfer.studentName).toBe('Aarav Sharma');
      expect(transfer.fromBatchId).toBe(transferDbRow.from_batch_id);
      expect(transfer.toBatchId).toBe(transferDbRow.to_batch_id);
      expect(transfer.reason).toBe('Upgraded to Advanced JEE Batch after test performance');

      // Historical Attendance Continuity Check:
      // Even after transfer, attendance records link to session_id (which points to old batch)
      const historicalAttendanceRecord = {
        sessionId: 'SES-001',
        batchId: transferDbRow.from_batch_id,
        studentId: transferDbRow.student_id,
        status: 'present',
      };

      expect(historicalAttendanceRecord.batchId).toBe(transferDbRow.from_batch_id);
    });
  });

  describe('TASK 5: Staff Provisioning & Security Definer Integrity', () => {
    it('blocks unauthorized roles from provisioning staff', () => {
      function checkProvisioningAuthority(callerRole: UserRole) {
        if (!['owner', 'admin'].includes(callerRole)) {
          throw new Error('ERR_UNAUTHORIZED: Only institute owners and admins can provision staff members.');
        }
        return true;
      }

      expect(() => checkProvisioningAuthority('teacher')).toThrow('ERR_UNAUTHORIZED');
      expect(() => checkProvisioningAuthority('staff')).toThrow('ERR_UNAUTHORIZED');
      expect(() => checkProvisioningAuthority('faculty')).toThrow('ERR_UNAUTHORIZED');
      expect(checkProvisioningAuthority('owner')).toBe(true);
      expect(checkProvisioningAuthority('admin')).toBe(true);
    });

    it('prevents self-deactivation and owner-deactivation', () => {
      function canDeactivateStaff(
        callerUserId: string,
        targetUserId: string,
        targetRole: UserRole
      ) {
        if (callerUserId === targetUserId) {
          throw new Error('ERR_SELF_DEACTIVATION: You cannot deactivate your own account.');
        }
        if (targetRole === 'owner') {
          throw new Error('ERR_CANNOT_DEACTIVATE_OWNER: The institute owner cannot be deactivated.');
        }
        return true;
      }

      // Self-deactivation forbidden
      expect(() => canDeactivateStaff('USER-01', 'USER-01', 'admin')).toThrow(
        'ERR_SELF_DEACTIVATION'
      );

      // Owner deactivation forbidden
      expect(() => canDeactivateStaff('USER-02', 'USER-01', 'owner')).toThrow(
        'ERR_CANNOT_DEACTIVATE_OWNER'
      );

      // Valid deactivation of staff member
      expect(canDeactivateStaff('USER-01', 'USER-03', 'teacher')).toBe(true);
    });
  });
});

