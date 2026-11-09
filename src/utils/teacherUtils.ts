import { Batch, Student, StaffMember, UserProfile, AttendanceSession, DailyAttendanceRecord } from '../types';

/**
 * Resolves the batches authorized for the given teacher/user.
 * Owners and Admins have global visibility; Teachers/Faculty have sandboxed access to their assigned cohorts.
 */
export function getTeacherAssignedBatches(
  currentUser: UserProfile,
  batches: Batch[],
  staffList: StaffMember[]
): Batch[] {
  if (!currentUser) return [];

  // Owners and Admins can view all batches (or choose to supervise any class)
  if (currentUser.role === 'owner' || currentUser.role === 'admin') {
    return batches;
  }

  // 1. Find matching staff record by email, user ID, or full name
  const staffRecord = staffList.find(
    s =>
      s.id === currentUser.id ||
      (s.email && currentUser.email && s.email.toLowerCase() === currentUser.email.toLowerCase()) ||
      s.name.toLowerCase() === currentUser.name.toLowerCase()
  );

  const assignedBatchIds = new Set<string>(staffRecord?.assignedBatchIds || []);

  return batches.filter(batch => {
    // Direct batch instructor ID match
    if (batch.instructorUserId && batch.instructorUserId === currentUser.id) {
      return true;
    }
    // Explicit assignment in staff record
    if (assignedBatchIds.has(batch.id)) {
      return true;
    }
    // Match instructor name
    if (
      batch.instructor &&
      currentUser.name &&
      batch.instructor.toLowerCase().includes(currentUser.name.toLowerCase())
    ) {
      return true;
    }
    return false;
  });
}

/**
 * Day of week short mapping for Indian coaching timetable conventions.
 */
const DAY_MAP: Record<number, string[]> = {
  0: ['sun', 'sunday'],
  1: ['mon', 'monday'],
  2: ['tue', 'tues', 'tuesday'],
  3: ['wed', 'wednesday'],
  4: ['thu', 'thurs', 'thursday'],
  5: ['fri', 'friday'],
  6: ['sat', 'saturday'],
};

/**
 * Checks if a batch is scheduled for a given date string (YYYY-MM-DD).
 */
export function isBatchScheduledForDate(batch: Batch, dateString: string): boolean {
  if (!batch.scheduleDays) return true; // If no days specified, assume daily / available

  const dateObj = new Date(dateString);
  const dayIndex = dateObj.getDay(); // 0 = Sun, 1 = Mon ...
  const validKeywords = DAY_MAP[dayIndex] || [];
  const scheduleLower = batch.scheduleDays.toLowerCase();

  if (scheduleLower.includes('daily') || scheduleLower.includes('mon-sat') || scheduleLower.includes('mon to sat')) {
    return dayIndex >= 1 && dayIndex <= 6;
  }

  return validKeywords.some(keyword => scheduleLower.includes(keyword));
}

/**
 * Checks if attendance has already been submitted for a batch on a given date.
 */
export function checkAttendanceStatus(
  batchId: string,
  attendanceSessions: AttendanceSession[],
  dateString: string
): { isMarked: boolean; session?: AttendanceSession } {
  const session = attendanceSessions.find(
    s => s.batchId === batchId && s.sessionDate === dateString
  );
  return {
    isMarked: !!session,
    session,
  };
}

/**
 * Builds the active student roster for attendance taking.
 * Preserves historical attendance records for transferred students if a session already exists.
 */
export function getBatchAttendanceRoster(
  batchId: string,
  students: Student[],
  attendanceRecords: DailyAttendanceRecord[],
  sessionId?: string
): Array<{
  studentId: string;
  studentName: string;
  studentCode: string;
  avatarSeed: string;
  gender: string;
  isTransferred?: boolean;
}> {
  // 1. Current students in this batch
  const currentBatchStudents = students.filter(
    s => s.batchId === batchId && s.status === 'active'
  );

  const studentMap = new Map<string, {
    studentId: string;
    studentName: string;
    studentCode: string;
    avatarSeed: string;
    gender: string;
    isTransferred?: boolean;
  }>();

  currentBatchStudents.forEach(s => {
    studentMap.set(s.id, {
      studentId: s.id,
      studentName: s.fullName,
      studentCode: s.studentId,
      avatarSeed: s.avatarSeed,
      gender: s.gender,
      isTransferred: false,
    });
  });

  // 2. If viewing a historical session, ensure any student who had records in that session is included
  if (sessionId) {
    const historicalStudentIds = attendanceRecords
      .filter(r => r.sessionId === sessionId)
      .map(r => r.studentId);

    historicalStudentIds.forEach(id => {
      if (!studentMap.has(id)) {
        const studentInfo = students.find(s => s.id === id);
        if (studentInfo) {
          studentMap.set(id, {
            studentId: studentInfo.id,
            studentName: studentInfo.fullName,
            studentCode: studentInfo.studentId,
            avatarSeed: studentInfo.avatarSeed,
            gender: studentInfo.gender,
            isTransferred: true,
          });
        }
      }
    });
  }

  return Array.from(studentMap.values()).sort((a, b) =>
    a.studentName.localeCompare(b.studentName)
  );
}

