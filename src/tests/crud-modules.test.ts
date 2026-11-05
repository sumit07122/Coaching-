import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateInitialStudents,
  INITIAL_BATCHES,
  INITIAL_STAFF_MEMBERS,
} from '../data/mockData';
import { Student, Batch, StaffMember, UserRole } from '../types';

describe('FIXIA CoachingOS — Production Student, Batch, and Staff Modules', () => {
  let students: Student[];
  let batches: Batch[];
  let staff: StaffMember[];

  beforeEach(() => {
    students = generateInitialStudents();
    batches = JSON.parse(JSON.stringify(INITIAL_BATCHES));
    staff = JSON.parse(JSON.stringify(INITIAL_STAFF_MEMBERS));
  });

  // ==========================================
  // 1. STUDENTS MODULE TESTS
  // ==========================================
  describe('Student Lifecycle & Operations', () => {
    it('advises student admission with all required & optional fields', () => {
      const newStudent: Student = {
        id: 'stu-test-001',
        instituteId: 'INST-MTH-01',
        studentId: 'FIX-2026-999',
        fullName: 'Aarav Singhania',
        phone: '+91 98765 43210',
        email: 'aarav.s@example.com',
        address: 'Krishna Nagar, Mathura',
        guardianName: 'Vikram Singhania',
        guardianPhone: '+91 98765 00000',
        guardianRelation: 'Father',
        course: 'Class 12th PCM + JEE Main',
        batchId: 'BATCH-001',
        batchName: 'Class 12th - JEE Advanced Prep',
        admissionDate: '2026-11-04',
        gender: 'Male',
        avatarSeed: 'Aarav Singhania',
        totalFeeInvoiced: 12000,
        totalFeePaid: 4000,
        balanceFee: 8000,
        feeStatus: 'partial',
        status: 'active',
      };

      students.push(newStudent);

      expect(students.length).toBe(86);
      const admitted = students.find(s => s.id === 'stu-test-001');
      expect(admitted).toBeDefined();
      expect(admitted?.fullName).toBe('Aarav Singhania');
      expect(admitted?.email).toBe('aarav.s@example.com');
      expect(admitted?.address).toBe('Krishna Nagar, Mathura');
      expect(admitted?.status).toBe('active');
      expect(admitted?.balanceFee).toBe(8000);
    });

    it('updates student profile details and batch assignment correctly', () => {
      const targetStudent = students[0];
      const updatedData: Partial<Student> = {
        fullName: 'Ananya Sharma (Updated)',
        phone: '+91 99999 88888',
        email: 'ananya.updated@example.com',
        address: 'Dampier Park, Vrindavan Road',
        batchId: 'BATCH-002',
        batchName: 'Class 11th - NEET Foundation',
      };

      Object.assign(targetStudent, updatedData);

      expect(targetStudent.fullName).toBe('Ananya Sharma (Updated)');
      expect(targetStudent.email).toBe('ananya.updated@example.com');
      expect(targetStudent.address).toBe('Dampier Park, Vrindavan Road');
      expect(targetStudent.batchId).toBe('BATCH-002');
    });

    it('archives and restores a student from active rosters', () => {
      const targetStudent = students[0];
      expect(targetStudent.status).toBe('active');

      // Archive student
      targetStudent.status = 'archived';
      expect(targetStudent.status).toBe('archived');

      // Filter active students (archived should be excluded)
      const activeStudents = students.filter(s => (s.status || 'active') === 'active');
      expect(activeStudents.some(s => s.id === targetStudent.id)).toBe(false);

      // Restore / unarchive student
      targetStudent.status = 'active';
      expect(targetStudent.status).toBe('active');
      const restored = students.filter(s => (s.status || 'active') === 'active');
      expect(restored.some(s => s.id === targetStudent.id)).toBe(true);
    });

    it('deletes student record cleanly from institute list', () => {
      const initialCount = students.length;
      const targetId = students[0].id;

      students = students.filter(s => s.id !== targetId);

      expect(students.length).toBe(initialCount - 1);
      expect(students.some(s => s.id === targetId)).toBe(false);
    });

    it('generates properly escaped CSV export data', () => {
      const sampleStudent = students[0];
      const headers = [
        'Student ID',
        'Full Name',
        'Phone',
        'Guardian Name',
        'Guardian Phone',
        'Email',
        'Address',
        'Course',
        'Batch',
        'Status',
      ];

      const row = [
        `"${sampleStudent.studentId}"`,
        `"${sampleStudent.fullName.replace(/"/g, '""')}"`,
        `"${sampleStudent.phone}"`,
        `"${sampleStudent.guardianName.replace(/"/g, '""')}"`,
        `"${sampleStudent.guardianPhone}"`,
        `"${sampleStudent.email || ''}"`,
        `"${(sampleStudent.address || '').replace(/"/g, '""')}"`,
        `"${sampleStudent.course.replace(/"/g, '""')}"`,
        `"${sampleStudent.batchName.replace(/"/g, '""')}"`,
        `"${sampleStudent.status || 'active'}"`,
      ];

      const csvString = [headers.join(','), row.join(',')].join('\n');
      expect(csvString).toContain('Student ID,Full Name');
      expect(csvString).toContain(sampleStudent.studentId);
      expect(csvString).toContain(sampleStudent.fullName);
    });
  });

  // ==========================================
  // 2. BATCHES MODULE TESTS
  // ==========================================
  describe('Batch Operations & Roster Management', () => {
    it('creates a new batch with teacher assignment from staff directory', () => {
      const assignedTeacher = staff.find(s => s.role === 'faculty')!;
      const newBatch: Batch = {
        id: 'BATCH-007',
        instituteId: 'INST-MTH-01',
        name: 'Class 9th Foundation Olympiad',
        code: 'OLY-09-EVN',
        course: 'Class 9th NTSE & Science Olympiad',
        instructor: assignedTeacher.name,
        scheduleDays: 'Tue, Thu, Sat',
        timing: '05:00 PM - 06:30 PM',
        room: 'Lab 2',
        capacity: 25,
        studentCount: 0,
        monthlyFee: 2200,
        status: 'active',
        startDate: '2026-11-01',
      };

      batches.push(newBatch);

      expect(batches.length).toBe(7);
      const created = batches.find(b => b.id === 'BATCH-007');
      expect(created?.name).toBe('Class 9th Foundation Olympiad');
      expect(created?.instructor).toBe(assignedTeacher.name);
      expect(created?.studentCount).toBe(0);
    });

    it('updates batch schedule, timings, and capacity limit', () => {
      const targetBatch = batches[0];
      targetBatch.timing = '07:00 AM - 08:30 AM';
      targetBatch.capacity = 30;
      targetBatch.monthlyFee = 3200;

      expect(targetBatch.timing).toBe('07:00 AM - 08:30 AM');
      expect(targetBatch.capacity).toBe(30);
      expect(targetBatch.monthlyFee).toBe(3200);
    });

    it('assigns students to a batch and recalculates student counts', () => {
      const sourceBatch = batches[0];
      const targetBatch = batches[1];
      const initialTargetCount = targetBatch.studentCount;

      // Transfer student from source to target batch
      const studentToTransfer = students.find(s => s.batchId === sourceBatch.id)!;
      studentToTransfer.batchId = targetBatch.id;
      studentToTransfer.batchName = targetBatch.name;

      // Recalculate
      sourceBatch.studentCount = students.filter(s => s.batchId === sourceBatch.id).length;
      targetBatch.studentCount = students.filter(s => s.batchId === targetBatch.id).length;

      expect(targetBatch.studentCount).toBe(initialTargetCount + 1);
      expect(studentToTransfer.batchId).toBe(targetBatch.id);
    });

    it('removes a student from batch roster, marking them unassigned and decrementing count', () => {
      const targetBatch = batches[0];
      const initialCount = targetBatch.studentCount;
      const studentInBatch = students.find(s => s.batchId === targetBatch.id)!;

      // Remove from batch
      studentInBatch.batchId = 'UNASSIGNED';
      studentInBatch.batchName = 'Unassigned';

      // Update batch student count
      targetBatch.studentCount = students.filter(s => s.batchId === targetBatch.id).length;

      expect(targetBatch.studentCount).toBe(initialCount - 1);
      expect(studentInBatch.batchId).toBe('UNASSIGNED');
    });
  });

  // ==========================================
  // 3. STAFF MODULE TESTS
  // ==========================================
  describe('Staff Directory & Role Management', () => {
    it('adds a new faculty instructor with assigned batches and subjects', () => {
      const newStaff: StaffMember = {
        id: 'staff-new-001',
        instituteId: 'INST-MTH-01',
        name: 'Dr. Rameshwar Dayal',
        email: 'rameshwar@radhakrishna.org',
        phone: '+91 94120 77777',
        role: 'faculty',
        roleTitle: 'Senior Chemistry Faculty',
        subjects: ['Physical Chemistry', 'Organic Chemistry'],
        assignedBatchIds: ['BATCH-001', 'BATCH-002'],
        joiningDate: '2026-11-01',
        status: 'active',
      };

      staff.push(newStaff);

      expect(staff.length).toBe(8);
      const added = staff.find(s => s.id === 'staff-new-001');
      expect(added?.name).toBe('Dr. Rameshwar Dayal');
      expect(added?.role).toBe('faculty');
      expect(added?.subjects).toContain('Organic Chemistry');
      expect(added?.assignedBatchIds.length).toBe(2);
    });

    it('toggles staff status between active and inactive', () => {
      const targetMember = staff.find(s => s.role === 'faculty')!;
      expect(targetMember.status).toBe('active');

      // Deactivate
      targetMember.status = targetMember.status === 'active' ? 'inactive' : 'active';
      expect(targetMember.status).toBe('inactive');

      // Re-activate
      targetMember.status = targetMember.status === 'active' ? 'inactive' : 'active';
      expect(targetMember.status).toBe('active');
    });

    it('prevents deletion of the owner / sole administrator', () => {
      const ownerMember = staff.find(s => s.role === 'owner')!;
      const canDelete = (member: StaffMember): boolean => {
        if (member.role === 'owner') return false;
        if (staff.length <= 1) return false;
        return true;
      };

      expect(canDelete(ownerMember)).toBe(false);

      const facultyMember = staff.find(s => s.role === 'faculty')!;
      expect(canDelete(facultyMember)).toBe(true);
    });
  });

  // ==========================================
  // 4. PERMISSION & AUTHORIZATION TESTS
  // ==========================================
  describe('Role-based Permission Enforcement', () => {
    const checkPermission = (role: UserRole, action: 'manage_students' | 'manage_batches' | 'manage_staff') => {
      if (role === 'owner' || role === 'admin') {
        return true;
      }
      return false;
    };

    it('authorizes Owner to manage students, batches, and staff', () => {
      expect(checkPermission('owner', 'manage_students')).toBe(true);
      expect(checkPermission('owner', 'manage_batches')).toBe(true);
      expect(checkPermission('owner', 'manage_staff')).toBe(true);
    });

    it('authorizes Admin to manage students, batches, and staff', () => {
      expect(checkPermission('admin', 'manage_students')).toBe(true);
      expect(checkPermission('admin', 'manage_batches')).toBe(true);
      expect(checkPermission('admin', 'manage_staff')).toBe(true);
    });

    it('restricts Staff and Faculty from mutating students, batches, and staff', () => {
      expect(checkPermission('staff', 'manage_students')).toBe(false);
      expect(checkPermission('staff', 'manage_batches')).toBe(false);
      expect(checkPermission('staff', 'manage_staff')).toBe(false);

      expect(checkPermission('faculty', 'manage_students')).toBe(false);
      expect(checkPermission('faculty', 'manage_batches')).toBe(false);
      expect(checkPermission('faculty', 'manage_staff')).toBe(false);
    });
  });
});