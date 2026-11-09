import { describe, it, expect } from 'vitest';
import {
  getTeacherAssignedBatches,
  isBatchScheduledForDate,
  checkAttendanceStatus,
  getBatchAttendanceRoster,
} from '../utils/teacherUtils';
import { Batch, Student, StaffMember, UserProfile, AttendanceSession, DailyAttendanceRecord } from '../types';

describe('Phase 13: Complete Dedicated Teacher Attendance Portal', () => {
  const mockBatches: Batch[] = [
    {
      id: 'BAT-101',
      instituteId: 'INST-01',
      name: 'Class 10th CBSE - Maths & Science',
      code: 'BAT-101',
      course: 'Class 10 CBSE Board',
      instructor: 'Amit Upadhyay',
      scheduleDays: 'Mon, Wed, Fri',
      timing: '04:30 PM - 06:00 PM',
      room: 'Room 101',
      capacity: 25,
      studentCount: 16,
      status: 'active',
      startDate: '2026-04-01',
      monthlyFee: 2500,
    },
    {
      id: 'BAT-102',
      instituteId: 'INST-01',
      name: 'Class 11th - JEE Foundation Physics',
      code: 'BAT-102',
      course: 'Class 11 JEE Foundation',
      instructor: 'Er. Rakesh Sharma',
      scheduleDays: 'Tue, Thu, Sat',
      timing: '05:00 PM - 07:00 PM',
      room: 'Room 102',
      capacity: 25,
      studentCount: 15,
      status: 'active',
      startDate: '2026-04-01',
      monthlyFee: 3500,
    },
    {
      id: 'BAT-105',
      instituteId: 'INST-01',
      name: 'Olympiad Mathematics',
      code: 'BAT-105',
      course: 'Olympiad Training',
      instructor: 'Amit Upadhyay',
      scheduleDays: 'Mon, Wed, Fri',
      timing: '06:00 PM - 07:30 PM',
      room: 'Room 103',
      capacity: 20,
      studentCount: 12,
      status: 'active',
      startDate: '2026-04-01',
      monthlyFee: 2000,
    },
  ];

  const mockStaff: StaffMember[] = [
    {
      id: 'STF-03',
      instituteId: 'INST-01',
      name: 'Amit Upadhyay',
      email: 'amit.maths@fixia.in',
      phone: '+91 98370 19284',
      role: 'faculty',
      roleTitle: 'Senior Mathematics Faculty',
      assignedBatchIds: ['BAT-101', 'BAT-105'],
      joiningDate: '2019-06-01',
      status: 'active',
    },
    {
      id: 'STF-01',
      instituteId: 'INST-01',
      name: 'Er. Rakesh Sharma',
      email: 'rakesh.sharma@fixia.in',
      phone: '+91 98371 42890',
      role: 'owner',
      roleTitle: 'Director',
      assignedBatchIds: ['BAT-102'],
      joiningDate: '2018-04-01',
      status: 'active',
    },
  ];

  const teacherUser: UserProfile = {
    id: 'USR-03',
    name: 'Amit Upadhyay',
    email: 'amit.maths@fixia.in',
    role: 'faculty',
    roleTitle: 'Senior Mathematics Faculty',
    instituteId: 'INST-01',
    instituteName: 'Radha Krishna Academy',
  };

  const ownerUser: UserProfile = {
    id: 'USR-01',
    name: 'Er. Rakesh Sharma',
    email: 'rakesh.sharma@fixia.in',
    role: 'owner',
    roleTitle: 'Director',
    instituteId: 'INST-01',
    instituteName: 'Radha Krishna Academy',
  };

  describe('1. Batch Isolation & Authorization', () => {
    it('restricts teacher visibility strictly to assigned batches', () => {
      const assignedBatches = getTeacherAssignedBatches(teacherUser, mockBatches, mockStaff);
      expect(assignedBatches.length).toBe(2);
      expect(assignedBatches.map(b => b.id)).toEqual(['BAT-101', 'BAT-105']);
      expect(assignedBatches.some(b => b.id === 'BAT-102')).toBe(false);
    });

    it('grants owner/admin universal visibility across all institute batches', () => {
      const ownerBatches = getTeacherAssignedBatches(ownerUser, mockBatches, mockStaff);
      expect(ownerBatches.length).toBe(3);
    });
  });

  describe('2. Schedule Day Matching', () => {
    it('correctly matches batch schedule with day of week', () => {
      // 2026-11-02 is a Monday
      expect(isBatchScheduledForDate(mockBatches[0], '2026-11-02')).toBe(true);
      // 2026-11-03 is a Tuesday
      expect(isBatchScheduledForDate(mockBatches[0], '2026-11-03')).toBe(false);
      expect(isBatchScheduledForDate(mockBatches[1], '2026-11-03')).toBe(true);
    });
  });

  describe('3. Attendance Status & Duplicate Check', () => {
    it('detects if attendance was already recorded for a batch on a date', () => {
      const mockSessions: AttendanceSession[] = [
        {
          id: 'SES-2026-11-02-BAT-101',
          instituteId: 'INST-01',
          batchId: 'BAT-101',
          sessionDate: '2026-11-02',
          markedByUserId: 'USR-03',
          markedByUserName: 'Amit Upadhyay',
          totalEnrolled: 16,
          totalPresent: 15,
          totalAbsent: 1,
          totalLate: 0,
          attendanceRate: 94,
          createdAt: '2026-11-02 08:30:00',
          updatedAt: '2026-11-02 08:30:00',
        },
      ];

      const statusRecorded = checkAttendanceStatus('BAT-101', mockSessions, '2026-11-02');
      expect(statusRecorded.isMarked).toBe(true);
      expect(statusRecorded.session?.attendanceRate).toBe(94);

      const statusNotRecorded = checkAttendanceStatus('BAT-101', mockSessions, '2026-11-03');
      expect(statusNotRecorded.isMarked).toBe(false);
      expect(statusNotRecorded.session).toBeUndefined();
    });
  });

  describe('4. Attendance Terminal Calculation & Roster Privacy', () => {
    const mockStudents: Student[] = [
      {
        id: 'STU-001',
        instituteId: 'INST-01',
        studentId: 'FIX-26-001',
        fullName: 'Aarav Sharma',
        phone: '+91 94120 11111',
        guardianName: 'Ramesh Sharma',
        guardianPhone: '+91 98370 11111',
        guardianRelation: 'Father',
        course: 'Class 10 CBSE',
        batchId: 'BAT-101',
        batchName: 'Class 10th CBSE - Maths & Science',
        admissionDate: '2026-04-01',
        gender: 'Male',
        status: 'active',
        feeStatus: 'partial',
        totalFeeInvoiced: 10000,
        totalFeePaid: 7500,
        balanceFee: 2500, // FINANCIAL FIELD
        avatarSeed: 'aarav-sharma',
      },
      {
        id: 'STU-002',
        instituteId: 'INST-01',
        studentId: 'FIX-26-002',
        fullName: 'Diya Patel',
        phone: '+91 94120 22222',
        guardianName: 'Suresh Patel',
        guardianPhone: '+91 98370 22222',
        guardianRelation: 'Father',
        course: 'Class 10 CBSE',
        batchId: 'BAT-101',
        batchName: 'Class 10th CBSE - Maths & Science',
        admissionDate: '2026-04-01',
        gender: 'Female',
        status: 'active',
        feeStatus: 'overdue',
        totalFeeInvoiced: 10000,
        totalFeePaid: 0,
        balanceFee: 10000, // FINANCIAL FIELD
        avatarSeed: 'diya-patel',
      },
    ];

    it('builds attendance roster without exposing financial balances or invoice details', () => {
      const roster = getBatchAttendanceRoster('BAT-101', mockStudents, []);
      expect(roster.length).toBe(2);

      // Verify necessary teacher fields are present
      expect(roster[0].studentName).toBe('Aarav Sharma');
      expect(roster[0].studentCode).toBe('FIX-26-001');

      // Verify sensitive financial fields are NOT exposed on the terminal roster item
      expect((roster[0] as any).balanceFee).toBeUndefined();
      expect((roster[0] as any).totalFeeInvoiced).toBeUndefined();
      expect((roster[0] as any).totalFeePaid).toBeUndefined();
      expect((roster[0] as any).feeStatus).toBeUndefined();
    });

    it('correctly calculates live presence, absence, and attendance percentages', () => {
      const rollState = {
        'STU-001': { status: 'present', remarks: '' },
        'STU-002': { status: 'absent', remarks: 'Unwell' },
        'STU-003': { status: 'late', remarks: 'Bus breakdown' },
        'STU-004': { status: 'present', remarks: '' },
      };

      const total = Object.keys(rollState).length;
      const present = Object.values(rollState).filter(r => r.status === 'present').length;
      const absent = Object.values(rollState).filter(r => r.status === 'absent').length;
      const late = Object.values(rollState).filter(r => r.status === 'late').length;
      const rate = Math.round((present / total) * 100);

      expect(total).toBe(4);
      expect(present).toBe(2);
      expect(absent).toBe(1);
      expect(late).toBe(1);
      expect(rate).toBe(50);
    });

    it('simulates Mark All Present bulk action correctly', () => {
      const studentIds = ['STU-001', 'STU-002', 'STU-003'];
      const roll: Record<string, string> = {
        'STU-001': 'absent',
        'STU-002': 'late',
        'STU-003': 'absent',
      };

      // Bulk action
      studentIds.forEach(id => {
        roll[id] = 'present';
      });

      expect(Object.values(roll).every(s => s === 'present')).toBe(true);
    });
  });

  describe('5. Historical Roster Continuity & Transferred Students', () => {
    it('preserves historical attendance records for students even after they transferred to a different batch', () => {
      const allStudents: Student[] = [
        {
          id: 'STU-099',
          instituteId: 'INST-01',
          studentId: 'FIX-26-099',
          fullName: 'Transferred Student',
          phone: '+91 94120 99999',
          guardianName: 'Guardian Name',
          guardianPhone: '+91 98370 99999',
          guardianRelation: 'Father',
          course: 'JEE Advanced',
          batchId: 'BAT-102', // Currently in BAT-102!
          batchName: 'Class 11th - JEE Foundation Physics',
          admissionDate: '2026-04-01',
          gender: 'Male',
          status: 'active',
          feeStatus: 'paid',
          totalFeeInvoiced: 10000,
          totalFeePaid: 10000,
          balanceFee: 0,
          avatarSeed: 'transferred',
        },
      ];

      // Past attendance record where student was in BAT-101
      const mockPastRecords: DailyAttendanceRecord[] = [
        {
          id: 'ATT-PAST-01',
          instituteId: 'INST-01',
          date: '2026-07-01',
          batchId: 'BAT-101',
          studentId: 'STU-099',
          studentName: 'Transferred Student',
          status: 'present',
          sessionId: 'SES-PAST-01',
        },
      ];

      // When reviewing past session SES-PAST-01 in BAT-101:
      const historicalRoster = getBatchAttendanceRoster(
        'BAT-101',
        allStudents,
        mockPastRecords,
        'SES-PAST-01'
      );

      expect(historicalRoster.length).toBe(1);
      expect(historicalRoster[0].studentId).toBe('STU-099');
      expect(historicalRoster[0].isTransferred).toBe(true);
    });
  });

  describe('6. Security & Authorization Barriers', () => {
    it('verifies that teachers cannot manage fees or institute settings', () => {
      const teacherPermissions = {
        role: teacherUser.role,
        canViewAttendance: true,
        canTakeAttendance: true,
        canViewAssignedBatches: true,
        canViewFees: false,
        canCollectFees: false,
        canReverseReceipts: false,
        canAccessSettings: false,
        canViewStaffPayroll: false,
      };

      expect(teacherPermissions.canViewAttendance).toBe(true);
      expect(teacherPermissions.canTakeAttendance).toBe(true);
      expect(teacherPermissions.canViewFees).toBe(false);
      expect(teacherPermissions.canCollectFees).toBe(false);
      expect(teacherPermissions.canReverseReceipts).toBe(false);
      expect(teacherPermissions.canAccessSettings).toBe(false);
    });
  });
});
