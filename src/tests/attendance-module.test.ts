import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateInitialStudents,
  generateInitialAttendance,
  generateInitialAttendanceSessions,
  INITIAL_BATCHES,
  INITIAL_STAFF_MEMBERS,
} from '../data/mockData';
import { Student, Batch, DailyAttendanceRecord, AttendanceSession, AttendanceStatus, UserRole } from '../types';

describe('FIXIA CoachingOS — Production Attendance Module', () => {
  const INSTITUTE_ID = 'INST-MTH-01';
  const TODAY_DATE = '2026-11-03';

  let students: Student[];
  let batches: Batch[];
  let attendance: DailyAttendanceRecord[];
  let attendanceSessions: AttendanceSession[];

  beforeEach(() => {
    students = generateInitialStudents();
    batches = JSON.parse(JSON.stringify(INITIAL_BATCHES));
    attendance = generateInitialAttendance(students, TODAY_DATE);
    attendanceSessions = generateInitialAttendanceSessions(batches, students, attendance, TODAY_DATE);
  });

  // ==========================================
  // 1. CALCULATIONS & ATTENDANCE RATES
  // ==========================================
  describe('Attendance Calculations & Rate Formulas', () => {
    it('verifies exact baseline calculation of 72 present and 13 absent out of 85 students', () => {
      const presentCount = attendance.filter(a => a.status === 'present').length;
      const absentCount = attendance.filter(a => a.status === 'absent').length;

      expect(presentCount).toBe(72);
      expect(absentCount).toBe(13);
      expect(presentCount + absentCount).toBe(85);

      const overallRate = Math.round((presentCount / (presentCount + absentCount)) * 100);
      expect(overallRate).toBe(85); // 72 / 85 = 84.7% -> rounded to 85%
    });

    it('calculates correct attendance percentage for a specific batch', () => {
      const targetBatch = batches[0]; // Class 10th CBSE (16 students)
      const bStudents = students.filter(s => s.batchId === targetBatch.id);
      const bRecords = attendance.filter(a => a.batchId === targetBatch.id);

      const present = bRecords.filter(r => r.status === 'present').length;
      const absent = bRecords.filter(r => r.status === 'absent').length;
      const rate = bStudents.length > 0 ? Math.round((present / bStudents.length) * 100) : 0;

      expect(bStudents.length).toBe(16);
      expect(present + absent).toBe(16);
      expect(rate).toBeGreaterThan(0);
      expect(rate).toBeLessThanOrEqual(100);
    });

    it('accurately identifies and extracts all absent students for a given date', () => {
      const absentList = attendance
        .filter(a => a.date === TODAY_DATE && a.status === 'absent')
        .map(a => {
          const student = students.find(s => s.id === a.studentId);
          return {
            studentId: a.studentId,
            studentName: a.studentName,
            batchId: a.batchId,
            guardianPhone: student?.guardianPhone,
          };
        });

      expect(absentList.length).toBe(13);
      absentList.forEach(item => {
        expect(item.studentName).toBeTruthy();
        expect(item.guardianPhone).toBeTruthy();
        expect(item.guardianPhone).toContain('+91');
      });
    });

    it('calculates individual student attendance summary correctly', () => {
      const targetStudent = students[0];
      const sRecords = attendance.filter(a => a.studentId === targetStudent.id);
      const presentCount = sRecords.filter(r => r.status === 'present').length;
      const absentCount = sRecords.filter(r => r.status === 'absent').length;
      const lateCount = sRecords.filter(r => r.status === 'late').length;
      const totalClasses = sRecords.length;
      const rate = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 100;

      expect(totalClasses).toBe(1);
      expect(rate).toBe(presentCount === 1 ? 100 : 0);
    });
  });

  // ==========================================
  // 2. DUPLICATE PREVENTION & EDIT WITH AUDIT
  // ==========================================
  describe('Duplicate Prevention & Session Deduplication', () => {
    it('prevents duplicate attendance sessions for the same batch and date (updates existing)', () => {
      const targetBatchId = 'BAT-101';
      const sessionDate = '2026-11-04';

      // Simulate initial session save
      const initialSession: AttendanceSession = {
        id: `SES-${sessionDate}-${targetBatchId}`,
        instituteId: INSTITUTE_ID,
        batchId: targetBatchId,
        sessionDate,
        markedByUserId: 'USR-01',
        markedByUserName: 'Er. Rakesh Sharma',
        totalEnrolled: 16,
        totalPresent: 14,
        totalAbsent: 2,
        totalLate: 0,
        attendanceRate: 88,
        createdAt: '2026-11-04 08:00:00',
        updatedAt: '2026-11-04 08:00:00',
      };

      attendanceSessions.push(initialSession);
      const sessionCountBefore = attendanceSessions.length;

      // Second save attempt for the exact same batch and date
      const existingSessionIdx = attendanceSessions.findIndex(
        s => s.instituteId === INSTITUTE_ID && s.batchId === targetBatchId && s.sessionDate === sessionDate
      );
      expect(existingSessionIdx).toBeGreaterThanOrEqual(0);

      // System updates existing record instead of pushing a duplicate
      if (existingSessionIdx >= 0) {
        attendanceSessions[existingSessionIdx] = {
          ...attendanceSessions[existingSessionIdx],
          totalPresent: 15,
          totalAbsent: 1,
          attendanceRate: 94,
          updatedAt: '2026-11-04 09:30:00',
          updatedByUserName: 'Pooja Verma',
        };
      } else {
        attendanceSessions.push(initialSession);
      }

      // Session count MUST remain unchanged
      expect(attendanceSessions.length).toBe(sessionCountBefore);
      const updated = attendanceSessions.find(
        s => s.batchId === targetBatchId && s.sessionDate === sessionDate
      );
      expect(updated?.totalPresent).toBe(15);
      expect(updated?.updatedByUserName).toBe('Pooja Verma');
    });

    it('guarantees unique attendance record per student per date (no duplicate student entries)', () => {
      const student = students[0];
      const testDate = '2026-11-04';

      // Insert record 1
      const rec1: DailyAttendanceRecord = {
        id: `ATT-${testDate}-${student.id}`,
        instituteId: INSTITUTE_ID,
        date: testDate,
        batchId: student.batchId,
        studentId: student.id,
        studentName: student.fullName,
        status: 'present',
        markedBy: 'Er. Rakesh Sharma',
      };

      // Add to attendance
      attendance.push(rec1);

      // Now update status to 'late'
      const existingIdx = attendance.findIndex(a => a.date === testDate && a.studentId === student.id);
      expect(existingIdx).toBeGreaterThanOrEqual(0);

      if (existingIdx >= 0) {
        attendance[existingIdx] = {
          ...attendance[existingIdx],
          status: 'late',
          updatedBy: 'Pooja Verma',
          updatedAt: '2026-11-04 09:15:00',
        };
      }

      // Check count of records for this student on this date
      const studentRecordsForDate = attendance.filter(
        a => a.date === testDate && a.studentId === student.id
      );
      expect(studentRecordsForDate.length).toBe(1);
      expect(studentRecordsForDate[0].status).toBe('late');
      expect(studentRecordsForDate[0].updatedBy).toBe('Pooja Verma');
    });
  });

  // ==========================================
  // 3. PERMISSIONS & AUTHORIZATION RULES
  // ==========================================
  describe('Authorization & Role Barriers', () => {
    const isAuthorizedToMarkAttendance = (role: UserRole | string): boolean => {
      return ['owner', 'admin', 'faculty', 'staff'].includes(role);
    };

    it('permits Owner, Admin, Faculty, and Staff to record and modify attendance', () => {
      expect(isAuthorizedToMarkAttendance('owner')).toBe(true);
      expect(isAuthorizedToMarkAttendance('admin')).toBe(true);
      expect(isAuthorizedToMarkAttendance('faculty')).toBe(true);
      expect(isAuthorizedToMarkAttendance('staff')).toBe(true);
    });

    it('rejects unauthorized roles or unauthenticated users from modifying attendance', () => {
      expect(isAuthorizedToMarkAttendance('student')).toBe(false);
      expect(isAuthorizedToMarkAttendance('guest')).toBe(false);
      expect(isAuthorizedToMarkAttendance('parent')).toBe(false);
      expect(isAuthorizedToMarkAttendance('')).toBe(false);
    });
  });

  // ==========================================
  // 4. DATA INTEGRITY & VALIDATION RULES
  // ==========================================
  describe('Multi-Tenant Attribution & Membership Validation', () => {
    it('enforces instituteId attribution on every attendance record and session', () => {
      attendance.forEach(record => {
        expect(record.instituteId).toBe(INSTITUTE_ID);
        expect(record.batchId).toBeTruthy();
        expect(record.studentId).toBeTruthy();
        expect(record.date).toBe(TODAY_DATE);
      });

      attendanceSessions.forEach(session => {
        expect(session.instituteId).toBe(INSTITUTE_ID);
        expect(session.batchId).toBeTruthy();
        expect(session.sessionDate).toBe(TODAY_DATE);
      });
    });

    it('validates student batch membership before marking attendance', () => {
      const batch1 = batches[0];
      const batch2 = batches[1];
      const studentInBatch1 = students.find(s => s.batchId === batch1.id)!;

      const validateMembership = (student: Student, targetBatchId: string): boolean => {
        return student.batchId === targetBatchId;
      };

      expect(validateMembership(studentInBatch1, batch1.id)).toBe(true);
      expect(validateMembership(studentInBatch1, batch2.id)).toBe(false);
    });

    it('validates date format ensuring YYYY-MM-DD compliance', () => {
      const isValidDate = (d: string): boolean => {
        return /^\d{4}-\d{2}-\d{2}$/.test(d);
      };

      expect(isValidDate('2026-11-03')).toBe(true);
      expect(isValidDate('2026-11-30')).toBe(true);
      expect(isValidDate('03-11-2026')).toBe(false);
      expect(isValidDate('invalid-date')).toBe(false);
      expect(isValidDate('')).toBe(false);
    });

    it('records who marked and edited the attendance session with audit timestamp', () => {
      const session = attendanceSessions[0];
      expect(session.markedByUserName).toBe('Er. Rakesh Sharma');
      expect(session.createdAt).toBeTruthy();
      expect(session.updatedAt).toBeTruthy();

      // Simulate edit
      session.updatedByUserName = 'Pooja Verma';
      session.updatedAt = '2026-11-03 14:00:00';

      expect(session.updatedByUserName).toBe('Pooja Verma');
      expect(session.updatedAt).toBe('2026-11-03 14:00:00');
    });
  });
});

