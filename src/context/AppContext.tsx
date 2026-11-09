import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Student,
  Batch,
  DailyAttendanceRecord,
  AttendanceSession,
  SaveAttendanceSessionInput,
  DailyAttendanceSummary,
  BatchAttendanceSummary,
  StudentAttendanceSummary,
  MonthlyAttendanceSummary,
  PaymentTransaction,
  FeePlan,
  CreateFeePlanInput,
  AssignFeePlanInput,
  FeeStatus,
  InstituteConfig,
  DashboardStats,
  AttendanceStatus,
  PaymentMethod,
  StaffMember,
  AuditLog,
  InAppNotification,
  CommercialSubscription,
  Expense,
  CreateExpenseInput,
  BatchSchedule,
  CreateBatchScheduleInput,
  StudentBatchTransfer,
  PlatformInstituteRecord,
  SoftwareLicenseRecord,
  PlatformAuditLog,
  CreatePlatformInstituteInput,
} from '../types';
import {
  INITIAL_INSTITUTE_CONFIG,
  INITIAL_BATCHES,
  INITIAL_FEE_PLANS,
  INITIAL_PAYMENT_TRANSACTIONS,
  INITIAL_STAFF_MEMBERS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_COMMERCIAL_SUBSCRIPTION,
  INITIAL_EXPENSES,
  INITIAL_BATCH_SCHEDULES,
  INITIAL_BATCH_TRANSFERS,
  INITIAL_PLATFORM_INSTITUTES,
  INITIAL_SOFTWARE_LICENSES,
  INITIAL_PLATFORM_AUDIT_LOGS,
  generateInitialStudents,
  generateInitialAttendance,
  generateInitialAttendanceSessions,
} from '../data/mockData';
import { useAuth } from './AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  fetchInstituteData,
  dbCreateStudent,
  dbUpdateStudent,
  dbDeleteStudent,
  dbCreateBatch,
  dbUpdateBatch,
  dbDeleteBatch,
  dbSaveAttendanceSession,
  dbRecordPayment,
  dbReversePayment,
  dbCreateFeePlan,
  dbLogAuditEvent,
  dbUpdateCommercialSubscription,
  dbCreateExpense,
  dbVoidExpense,
  dbCreateBatchSchedule,
  dbDeleteBatchSchedule,
  dbTransferStudentBatch,
} from '../services/supabaseData';

export interface RecordPaymentInput {
  studentId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate?: string;
  remarks?: string;
}

export interface AddStudentInput {
  fullName: string;
  phone: string;
  guardianName: string;
  guardianPhone: string;
  guardianRelation: 'Father' | 'Mother' | 'Guardian';
  course: string;
  batchId: string;
  admissionDate: string;
  gender: 'Male' | 'Female' | 'Other';
  totalFeeInvoiced: number;
  initialPayment?: number;
  email?: string;
  address?: string;
  notes?: string;
}

interface AppContextType {
  students: Student[];
  batches: Batch[];
  attendance: DailyAttendanceRecord[];
  attendanceSessions: AttendanceSession[];
  payments: PaymentTransaction[];
  feePlans: FeePlan[];
  staff: StaffMember[];
  auditLogs: AuditLog[];
  notifications: InAppNotification[];
  commercialSubscription: CommercialSubscription;
  expenses: Expense[];
  batchSchedules: BatchSchedule[];
  batchTransfers: StudentBatchTransfer[];
  hasModuleAccess: (moduleKey: string) => boolean;
  instituteConfig: InstituteConfig;
  dashboardStats: DashboardStats;
  todayDate: string;
  activeAttendanceDate: string;
  setActiveAttendanceDate: (d: string) => void;
  selectedBatchIdForAttendance: string;
  setSelectedBatchIdForAttendance: (id: string) => void;
  
  // Modals & previews
  previewReceipt: PaymentTransaction | null;
  setPreviewReceipt: (t: PaymentTransaction | null) => void;
  isArchitectureModalOpen: boolean;
  setIsArchitectureModalOpen: (open: boolean) => void;
  isPaymentModalOpen: boolean;
  setIsPaymentModalOpen: (open: boolean) => void;
  selectedStudentForPayment: Student | null;
  setSelectedStudentForPayment: (s: Student | null) => void;
  isNotificationModalOpen: boolean;
  setIsNotificationModalOpen: (open: boolean) => void;
  
  // Actions
  addStudent: (data: AddStudentInput) => Student;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  archiveStudent: (id: string) => void;
  unarchiveStudent: (id: string) => void;
  addBatch: (batch: Omit<Batch, 'id' | 'studentCount' | 'instituteId'> & { instituteId?: string }) => Batch;
  updateBatch: (id: string, updates: Partial<Batch>) => void;
  deleteBatch: (id: string) => void;
  assignStudentsToBatch: (batchId: string, studentIds: string[]) => void;
  removeStudentFromBatch: (batchId: string, studentId: string) => void;
  addStaff: (staffMember: Omit<StaffMember, 'id' | 'instituteId'> & { instituteId?: string }) => StaffMember;
  updateStaff: (id: string, updates: Partial<StaffMember>) => void;
  deleteStaff: (id: string) => void;
  toggleStaffStatus: (id: string) => void;
  markAttendance: (date: string, batchId: string, studentId: string, status: AttendanceStatus, remarks?: string) => void;
  markAllPresent: (date: string, batchId: string) => void;
  saveAttendanceSession: (input: SaveAttendanceSessionInput) => { session: AttendanceSession; records: DailyAttendanceRecord[] };
  getBatchAttendanceRate: (batchId: string) => number;
  getStudentAttendanceSummary: (studentId: string) => StudentAttendanceSummary;
  getAbsentStudentsForDate: (date: string, batchId?: string) => Array<{ student: Student; batch: Batch; status: AttendanceStatus; remarks?: string }>;
  getDailyAttendanceSummaries: (date: string) => DailyAttendanceSummary[];
  getBatchAttendanceSummaries: () => BatchAttendanceSummary[];
  getMonthlyAttendanceSummaries: () => MonthlyAttendanceSummary[];
  addFeePlan: (input: CreateFeePlanInput) => FeePlan;
  assignFeePlan: (input: AssignFeePlanInput) => Student;
  recordPayment: (input: RecordPaymentInput) => PaymentTransaction;
  reversePayment: (paymentId: string, reason: string) => void;
  addExpense: (input: CreateExpenseInput) => Expense;
  voidExpense: (expenseId: string, reason: string) => void;
  addBatchSchedule: (input: CreateBatchScheduleInput) => BatchSchedule;
  deleteBatchSchedule: (scheduleId: string) => void;
  transferStudentBatch: (studentId: string, newBatchId: string, reason?: string) => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  deleteNotification: (id: string) => void;
  addAnnouncement: (title: string, message: string, priority?: 'normal' | 'high') => InAppNotification;
  updateCommercialSubscription: (updates: Partial<CommercialSubscription>) => void;
  logAuditEvent: (action: string, entityType: any, entityId: string, details?: any) => void;
  // Phase 15: FIXIA Super Admin Platform Governance
  platformInstitutes: PlatformInstituteRecord[];
  softwareLicenses: SoftwareLicenseRecord[];
  platformAuditLogs: PlatformAuditLog[];
  createPlatformInstitute: (input: CreatePlatformInstituteInput) => PlatformInstituteRecord;
  updateInstituteStatus: (instituteId: string, status: 'active' | 'suspended' | 'trial', reason: string) => void;
  updateInstituteCommercialPlan: (instituteId: string, updates: Partial<CommercialSubscription>, reason: string) => void;
  issueSoftwareLicense: (input: { instituteId: string; version: string; maxStudents: number; offlineSupport: boolean }) => SoftwareLicenseRecord;
  revokeSoftwareLicense: (licenseId: string, reason: string) => void;
  recordPlatformAudit: (action: PlatformAuditLog['action'], instituteId: string, details: Record<string, any>, reason: string) => void;

  updateInstituteConfig: (updates: Partial<InstituteConfig>) => void;
  resetToDemoDefaults: () => void;
}

const STORAGE_PREFIX = 'fixia_coachingos_v1_';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const todayDate = '2026-11-03';

  // Initialize or restore state
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}students`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return generateInitialStudents();
  });

  const [batches, setBatches] = useState<Batch[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}batches`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_BATCHES;
  });

  const [attendance, setAttendance] = useState<DailyAttendanceRecord[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}attendance`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return generateInitialAttendance(generateInitialStudents(), todayDate);
  });

  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}attendance_sessions`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    const initialStu = generateInitialStudents();
    const initialAtt = generateInitialAttendance(initialStu, todayDate);
    return generateInitialAttendanceSessions(INITIAL_BATCHES, initialStu, initialAtt, todayDate);
  });

  const [payments, setPayments] = useState<PaymentTransaction[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}payments`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_PAYMENT_TRANSACTIONS;
  });

  const [staff, setStaff] = useState<StaffMember[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}staff`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_STAFF_MEMBERS;
  });

  const [feePlans, setFeePlans] = useState<FeePlan[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}fee_plans`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_FEE_PLANS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}audit_logs`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_AUDIT_LOGS;
  });

  const [notifications, setNotifications] = useState<InAppNotification[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}notifications`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_NOTIFICATIONS;
  });

  const [commercialSubscription, setCommercialSubscription] = useState<CommercialSubscription>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}commercial`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_COMMERCIAL_SUBSCRIPTION;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}expenses`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_EXPENSES;
  });

  const [batchSchedules, setBatchSchedules] = useState<BatchSchedule[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}schedules`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_BATCH_SCHEDULES;
  });

  const [batchTransfers, setBatchTransfers] = useState<StudentBatchTransfer[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}transfers`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_BATCH_TRANSFERS;
  });

  // Phase 15: FIXIA Super Admin Platform Governance State
  const [platformInstitutes, setPlatformInstitutes] = useState<PlatformInstituteRecord[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}platform_institutes`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_PLATFORM_INSTITUTES;
  });

  const [softwareLicenses, setSoftwareLicenses] = useState<SoftwareLicenseRecord[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}software_licenses`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_SOFTWARE_LICENSES;
  });

  const [platformAuditLogs, setPlatformAuditLogs] = useState<PlatformAuditLog[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}platform_audit_logs`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_PLATFORM_AUDIT_LOGS;
  });

  const [instituteConfig, setInstituteConfig] = useState<InstituteConfig>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}config`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_INSTITUTE_CONFIG;
  });

  // Navigation & UI state
  const [activeAttendanceDate, setActiveAttendanceDate] = useState<string>(todayDate);
  const [selectedBatchIdForAttendance, setSelectedBatchIdForAttendance] = useState<string>('BAT-101');
  const [previewReceipt, setPreviewReceipt] = useState<PaymentTransaction | null>(null);
  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState<boolean>(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<Student | null>(null);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}students`, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}batches`, JSON.stringify(batches));
  }, [batches]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}attendance`, JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}attendance_sessions`, JSON.stringify(attendanceSessions));
  }, [attendanceSessions]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}payments`, JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}staff`, JSON.stringify(staff));
  }, [staff]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}fee_plans`, JSON.stringify(feePlans));
  }, [feePlans]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}audit_logs`, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}notifications`, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}commercial`, JSON.stringify(commercialSubscription));
  }, [commercialSubscription]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}expenses`, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}schedules`, JSON.stringify(batchSchedules));
  }, [batchSchedules]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}transfers`, JSON.stringify(batchTransfers));
  }, [batchTransfers]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}config`, JSON.stringify(instituteConfig));
  }, [instituteConfig]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}platform_institutes`, JSON.stringify(platformInstitutes));
  }, [platformInstitutes]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}software_licenses`, JSON.stringify(softwareLicenses));
  }, [softwareLicenses]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}platform_audit_logs`, JSON.stringify(platformAuditLogs));
  }, [platformAuditLogs]);

  // Load and synchronize data from PostgreSQL database via Supabase when configured
  useEffect(() => {
    if (isSupabaseConfigured && currentUser?.instituteId && currentUser.instituteId !== 'PENDING_ONBOARDING') {
      fetchInstituteData(currentUser.instituteId)
        .then(data => {
          if (!data) return;
          if (data.students && data.students.length > 0) setStudents(data.students);
          if (data.batches && data.batches.length > 0) setBatches(data.batches);
          if (data.feePlans && data.feePlans.length > 0) setFeePlans(data.feePlans);
          if (data.payments && data.payments.length > 0) setPayments(data.payments);
          if (data.attendanceSessions && data.attendanceSessions.length > 0) setAttendanceSessions(data.attendanceSessions);
          if (data.attendance && data.attendance.length > 0) setAttendance(data.attendance);
          if (data.staff && data.staff.length > 0) setStaff(data.staff);
          if (data.auditLogs && data.auditLogs.length > 0) setAuditLogs(data.auditLogs);
          if (data.commercialSubscription) setCommercialSubscription(data.commercialSubscription);
          if (data.expenses && data.expenses.length > 0) setExpenses(data.expenses);
          if (data.batchSchedules && data.batchSchedules.length > 0) setBatchSchedules(data.batchSchedules);
          if (data.batchTransfers && data.batchTransfers.length > 0) setBatchTransfers(data.batchTransfers);
        })
        .catch(err => {
          console.error('Failed to load institute records from Supabase:', err);
        });
    }
  }, [currentUser?.instituteId]);

  // Recalculate batch student counts when students change
  useEffect(() => {
    setBatches(prevBatches => {
      let changed = false;
      const updated = prevBatches.map(b => {
        const count = students.filter(s => s.batchId === b.id).length;
        if (b.studentCount !== count) {
          changed = true;
          return { ...b, studentCount: count };
        }
        return b;
      });
      return changed ? updated : prevBatches;
    });
  }, [students]);

  // Calculate live dashboard statistics dynamically from actual institute records
  const dashboardStats: DashboardStats = useMemo(() => {
    const instId = currentUser?.instituteId || 'INST-MTH-01';

    // Total active students belonging to this institute
    const instStudents = students.filter(
      s => (s.instituteId === instId || s.institute_id === instId) && s.status === 'active'
    );
    const totalStudents = instStudents.length;

    // Active batches belonging to this institute
    const instBatches = batches.filter(
      b => (b.instituteId === instId || b.institute_id === instId) && b.status === 'active'
    );
    const activeBatches = instBatches.length;

    // Today's attendance belonging to this institute
    const todayRecords = attendance.filter(
      a => (a.instituteId === instId || a.institute_id === instId) && a.date === todayDate
    );
    const presentToday = todayRecords.filter(a => a.status === 'present').length;
    const absentToday = todayRecords.filter(a => a.status === 'absent').length;
    const totalMarked = presentToday + absentToday;
    const attendanceRate = totalMarked > 0 ? Math.round((presentToday / totalMarked) * 100) : 0;

    // Monthly collection (sum of confirmed, non-reversed payments in current month for this institute)
    const currentMonthPrefix = '2026-11';
    const collectedThisMonth = payments
      .filter(
        p =>
          (p.instituteId === instId || p.institute_id === instId) &&
          p.status !== 'reversed' &&
          p.paymentDate.startsWith(currentMonthPrefix)
      )
      .reduce((sum, p) => sum + p.amount, 0);

    // Outstanding dues across active students for this institute
    const pendingFees = instStudents.reduce((sum, s) => sum + Math.max(0, s.balanceFee), 0);

    return {
      totalStudents,
      activeBatches,
      presentToday,
      absentToday,
      attendanceRate,
      collectedThisMonth,
      pendingFees,
    };
  }, [students, batches, attendance, payments, todayDate, currentUser]);

  const hasModuleAccess = (moduleKey: string): boolean => {
    if (!commercialSubscription.enabledModules || commercialSubscription.enabledModules.length === 0) {
      return true;
    }
    return commercialSubscription.enabledModules.includes(moduleKey);
  };

  // Actions
  const addStudent = (input: AddStudentInput): Student => {
    // Commercial Entitlement & Capacity Check
    const instId = currentUser.instituteId || 'INST-MTH-01';
    const activeStudentCount = students.filter(
      s => (s.instituteId === instId || s.institute_id === instId) && s.status === 'active'
    ).length;

    if (commercialSubscription.modelType === 'saas_subscription') {
      const subStatus = commercialSubscription.subscriptionStatus || commercialSubscription.status;
      if (subStatus && !['active', 'trial'].includes(subStatus)) {
        throw new Error(
          `Commercial admission blocked: SaaS subscription is ${subStatus}. Renewal required.`
        );
      }
    } else if (commercialSubscription.modelType === 'one_time_licence') {
      const licStatus = commercialSubscription.licenceStatus || 'active';
      if (licStatus !== 'active') {
        throw new Error(
          `Commercial admission blocked: One-time licence status is ${licStatus}. Activation or renewal required.`
        );
      }
    }

    if (activeStudentCount >= commercialSubscription.studentLimit) {
      throw new Error(
        `Commercial student quota reached: Current active enrollment (${activeStudentCount}) has reached the plan capacity of ${commercialSubscription.studentLimit} students. Please upgrade your commercial plan.`
      );
    }

    const seq = students.length + 1;
    const seqStr = seq.toString().padStart(3, '0');
    const studentId = `FIX-MTH-26-${seqStr}`;
    const id = `STU-${seqStr}`;
    const batch = batches.find(b => b.id === input.batchId) || batches[0];

    const initialPaid = input.initialPayment || 0;
    const balance = Math.max(0, input.totalFeeInvoiced - initialPaid);
    let feeStatus: 'paid' | 'partial' | 'overdue' = 'overdue';
    if (balance === 0) {
      feeStatus = 'paid';
    } else if (initialPaid > 0) {
      feeStatus = 'partial';
    }

    const newStudent: Student = {
      id,
      instituteId: currentUser.instituteId || 'INST-MTH-01',
      institute_id: currentUser.instituteId || 'INST-MTH-01',
      studentId,
      fullName: input.fullName,
      phone: input.phone,
      guardianName: input.guardianName,
      guardianPhone: input.guardianPhone,
      guardianRelation: input.guardianRelation,
      course: input.course || batch.course,
      batchId: batch.id,
      batchName: batch.name,
      admissionDate: input.admissionDate || todayDate,
      gender: input.gender,
      email: input.email,
      address: input.address,
      status: 'active',
      feeStatus,
      totalFeeInvoiced: input.totalFeeInvoiced,
      totalFeePaid: initialPaid,
      balanceFee: balance,
      lastPaymentDate: initialPaid > 0 ? todayDate : undefined,
      notes: input.notes,
      avatarSeed: input.fullName.toLowerCase().replace(/\s+/g, '-'),
    };

    setStudents(prev => [newStudent, ...prev]);
    logAuditEvent('ADMIT_STUDENT', 'student', newStudent.id, {
      name: newStudent.fullName,
      batch: batch.name,
      invoiced: input.totalFeeInvoiced,
    });

    // Sync student admission to Supabase when backend is connected
    if (isSupabaseConfigured) {
      dbCreateStudent(currentUser.instituteId || 'INST-MTH-01', {
        studentId: newStudent.studentId,
        fullName: newStudent.fullName,
        phone: newStudent.phone,
        email: newStudent.email,
        address: newStudent.address,
        guardianName: newStudent.guardianName,
        guardianPhone: newStudent.guardianPhone,
        guardianRelation: newStudent.guardianRelation,
        course: newStudent.course,
        batchId: newStudent.batchId,
        admissionDate: newStudent.admissionDate,
        gender: newStudent.gender,
        status: newStudent.status,
        feeStatus: newStudent.feeStatus,
        totalFeeInvoiced: newStudent.totalFeeInvoiced,
        totalFeePaid: newStudent.totalFeePaid,
        balanceFee: newStudent.balanceFee,
        notes: newStudent.notes,
      })
        .then(created => {
          if (created) {
            setStudents(prev => prev.map(s => (s.id === newStudent.id ? created : s)));
          }
        })
        .catch(err => {
          console.error('Supabase student insertion error:', err);
        });
    }

    // If initial payment was made, generate payment record and receipt
    if (initialPaid > 0) {
      const receiptNumber = `${instituteConfig.receiptPrefix}${Date.now().toString().slice(-4)}`;
      const txn: PaymentTransaction = {
        id: `TXN-${Date.now()}`,
        instituteId: currentUser.instituteId || 'INST-MTH-01',
        institute_id: currentUser.instituteId || 'INST-MTH-01',
        receiptNumber,
        studentId: newStudent.id,
        studentName: newStudent.fullName,
        batchId: batch.id,
        batchName: batch.name,
        amount: initialPaid,
        paymentMethod: 'UPI',
        paymentDate: todayDate,
        collectedBy: currentUser.name,
        remarks: 'Admission / Initial Instalment',
        invoicedAmount: input.totalFeeInvoiced,
        paidAmountPrior: 0,
        balanceRemaining: balance,
      };
      setPayments(prev => [txn, ...prev]);

      if (isSupabaseConfigured) {
        dbRecordPayment(currentUser.instituteId || 'INST-MTH-01', txn, newStudent)
          .catch(err => console.error('Supabase initial payment error:', err));
      }
    }

    // Also auto-add today's attendance record (default present)
    const attRecord: DailyAttendanceRecord = {
      id: `ATT-${todayDate}-${newStudent.id}`,
      instituteId: currentUser.instituteId || 'INST-MTH-01',
      institute_id: currentUser.instituteId || 'INST-MTH-01',
      date: todayDate,
      batchId: batch.id,
      studentId: newStudent.id,
      studentName: newStudent.fullName,
      status: 'present',
    };
    setAttendance(prev => [attRecord, ...prev]);

    return newStudent;
  };

  const updateStudent = (id: string, updates: Partial<Student>) => {
    setStudents(prev =>
      prev.map(s => {
        if (s.id !== id) return s;
        const updated = { ...s, ...updates };
        // Recalculate balance if invoice or paid changed
        if (updates.totalFeeInvoiced !== undefined || updates.totalFeePaid !== undefined) {
          const inv = updates.totalFeeInvoiced ?? updated.totalFeeInvoiced;
          const paid = updates.totalFeePaid ?? updated.totalFeePaid;
          updated.balanceFee = Math.max(0, inv - paid);
          if (updated.balanceFee === 0) updated.feeStatus = 'paid';
          else if (paid > 0) updated.feeStatus = 'partial';
          else updated.feeStatus = 'overdue';
        }
        return updated;
      })
    );

    if (isSupabaseConfigured) {
      dbUpdateStudent(currentUser.instituteId || 'INST-MTH-01', id, updates)
        .catch(err => console.error('Supabase student update error:', err));
    }
  };

  const deleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    setAttendance(prev => prev.filter(a => a.studentId !== id));
    logAuditEvent('DELETE_STUDENT', 'student', id);

    if (isSupabaseConfigured) {
      dbDeleteStudent(currentUser.instituteId || 'INST-MTH-01', id)
        .catch(err => console.error('Supabase student delete error:', err));
    }
  };

  const addBatch = (batchData: Omit<Batch, 'id' | 'studentCount' | 'instituteId'> & { instituteId?: string }): Batch => {
    const seq = batches.length + 1;
    const newBatch: Batch = {
      ...batchData,
      id: `BAT-10${seq}`,
      instituteId: currentUser.instituteId || 'INST-MTH-01',
      institute_id: currentUser.instituteId || 'INST-MTH-01',
      studentCount: 0,
    };
    setBatches(prev => [...prev, newBatch]);
    logAuditEvent('CREATE_BATCH', 'batch', newBatch.id, { name: newBatch.name, course: newBatch.course });

    if (isSupabaseConfigured) {
      dbCreateBatch(currentUser.instituteId || 'INST-MTH-01', batchData)
        .then(created => {
          if (created) {
            setBatches(prev => prev.map(b => (b.id === newBatch.id ? created : b)));
          }
        })
        .catch(err => console.error('Supabase batch creation error:', err));
    }

    return newBatch;
  };

  const updateBatch = (id: string, updates: Partial<Batch>) => {
    setBatches(prev =>
      prev.map(b => (b.id === id ? { ...b, ...updates } : b))
    );
    // If name or course changed, sync to students
    if (updates.name || updates.course) {
      setStudents(prev =>
        prev.map(s => {
          if (s.batchId !== id) return s;
          return {
            ...s,
            batchName: updates.name || s.batchName,
            course: updates.course || s.course,
          };
        })
      );
    }

    if (isSupabaseConfigured) {
      dbUpdateBatch(currentUser.instituteId || 'INST-MTH-01', id, updates)
        .catch(err => console.error('Supabase batch update error:', err));
    }
  };

  const deleteBatch = (id: string) => {
    setBatches(prev => prev.filter(b => b.id !== id));
    logAuditEvent('DELETE_BATCH', 'batch', id);

    if (isSupabaseConfigured) {
      dbDeleteBatch(currentUser.instituteId || 'INST-MTH-01', id)
        .catch(err => console.error('Supabase batch delete error:', err));
    }
  };

  const assignStudentsToBatch = (batchId: string, studentIds: string[]) => {
    const batch = batches.find(b => b.id === batchId);
    if (!batch) return;

    setStudents(prev =>
      prev.map(s => {
        if (!studentIds.includes(s.id)) return s;
        return {
          ...s,
          batchId: batch.id,
          batchName: batch.name,
          course: batch.course,
        };
      })
    );
    logAuditEvent('ASSIGN_STUDENTS_TO_BATCH', 'batch', batchId, { studentIds });
  };

  const removeStudentFromBatch = (batchId: string, studentId: string) => {
    setStudents(prev =>
      prev.map(s => {
        if (s.id !== studentId || s.batchId !== batchId) return s;
        return {
          ...s,
          batchId: 'UNASSIGNED',
          batchName: 'Unassigned Batch',
        };
      })
    );
    logAuditEvent('REMOVE_STUDENT_FROM_BATCH', 'batch', batchId, { studentId });
  };

  const addStaff = (staffData: Omit<StaffMember, 'id' | 'instituteId'> & { instituteId?: string }): StaffMember => {
    const seq = staff.length + 1;
    const newStaff: StaffMember = {
      ...staffData,
      id: `STF-${seq.toString().padStart(2, '0')}`,
      instituteId: currentUser.instituteId || 'INST-MTH-01',
      institute_id: currentUser.instituteId || 'INST-MTH-01',
    };
    setStaff(prev => [...prev, newStaff]);
    logAuditEvent('ADD_STAFF', 'staff', newStaff.id, { name: newStaff.name, role: newStaff.role });
    return newStaff;
  };

  const updateStaff = (id: string, updates: Partial<StaffMember>) => {
    setStaff(prev => prev.map(s => (s.id === id ? { ...s, ...updates } : s)));
    logAuditEvent('UPDATE_STAFF', 'staff', id, updates);
  };

  const deleteStaff = (id: string) => {
    setStaff(prev => prev.filter(s => s.id !== id));
    logAuditEvent('DELETE_STAFF', 'staff', id);
  };

  const toggleStaffStatus = (id: string) => {
    setStaff(prev =>
      prev.map(s => {
        if (s.id !== id) return s;
        const newStatus = s.status === 'active' ? 'inactive' : 'active';
        logAuditEvent('TOGGLE_STAFF_STATUS', 'staff', id, { newStatus });
        return { ...s, status: newStatus };
      })
    );
  };

  const markAttendance = (
    date: string,
    batchId: string,
    studentId: string,
    status: AttendanceStatus,
    remarks?: string
  ) => {
    if (!['owner', 'admin', 'faculty', 'staff'].includes(currentUser.role)) {
      throw new Error('Unauthorized: Only authorized staff may mark attendance.');
    }

    const student = students.find(s => s.id === studentId);
    if (!student) throw new Error('Student not found.');
    if (student.batchId !== batchId) {
      throw new Error(`Student ${student.fullName} is not enrolled in batch ${batchId}.`);
    }

    const instituteId = currentUser.instituteId || 'INST-MTH-01';
    const nowTimestamp = new Date().toISOString();

    setAttendance(prev => {
      const existingIdx = prev.findIndex(
        a => a.date === date && a.studentId === studentId
      );
      const studentName = student.fullName;

      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = {
          ...copy[existingIdx],
          batchId,
          status,
          remarks: remarks !== undefined ? remarks : copy[existingIdx].remarks,
          updatedBy: currentUser.name,
          updatedAt: nowTimestamp,
        };
        return copy;
      } else {
        return [
          ...prev,
          {
            id: `ATT-${date}-${studentId}`,
            instituteId,
            institute_id: instituteId,
            date,
            batchId,
            studentId,
            studentName,
            status,
            remarks,
            markedBy: currentUser.name,
            updatedBy: currentUser.name,
            updatedAt: nowTimestamp,
            sessionId: `SES-${date}-${batchId}`,
          },
        ];
      }
    });
  };

  const markAllPresent = (date: string, batchId: string) => {
    if (!['owner', 'admin', 'faculty', 'staff'].includes(currentUser.role)) {
      throw new Error('Unauthorized: Only authorized staff may mark attendance.');
    }

    const batchStudents = students.filter(s => s.batchId === batchId && s.status !== 'archived');
    const instituteId = currentUser.instituteId || 'INST-MTH-01';
    const nowTimestamp = new Date().toISOString();

    setAttendance(prev => {
      // Remove existing records for this batch and date
      const others = prev.filter(
        a => !(a.date === date && a.batchId === batchId)
      );
      const newBatchRecords: DailyAttendanceRecord[] = batchStudents.map(s => ({
        id: `ATT-${date}-${s.id}`,
        instituteId,
        institute_id: instituteId,
        date,
        batchId,
        studentId: s.id,
        studentName: s.fullName,
        status: 'present',
        markedBy: currentUser.name,
        updatedBy: currentUser.name,
        updatedAt: nowTimestamp,
        sessionId: `SES-${date}-${batchId}`,
      }));
      return [...others, ...newBatchRecords];
    });

    logAuditEvent('MARK_ALL_PRESENT', 'attendance', batchId, {
      date,
      count: batchStudents.length,
      markedBy: currentUser.name,
    });
  };

  const saveAttendanceSession = (input: SaveAttendanceSessionInput): {
    session: AttendanceSession;
    records: DailyAttendanceRecord[];
  } => {
    // 1. Role permission check: must be owner, admin, faculty, or staff
    if (!['owner', 'admin', 'faculty', 'staff'].includes(currentUser.role)) {
      throw new Error('Unauthorized: You do not have permission to record or modify attendance.');
    }

    // 2. Validate date format
    if (!input.date || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
      throw new Error('Invalid attendance date format. Expected YYYY-MM-DD.');
    }

    // 3. Validate batch exists
    const batch = batches.find(b => b.id === input.batchId);
    if (!batch) {
      throw new Error(`Batch with ID "${input.batchId}" not found.`);
    }

    // 4. Validate student membership in batch
    const validBatchStudents = students.filter(s => s.batchId === input.batchId && s.status !== 'archived');
    const validStudentIds = new Set(validBatchStudents.map(s => s.id));

    // Filter provided records to only enrolled students
    const validRecords = input.records.filter(r => validStudentIds.has(r.studentId));

    // Calculate metrics
    const totalPresent = validRecords.filter(r => r.status === 'present').length;
    const totalAbsent = validRecords.filter(r => r.status === 'absent').length;
    const totalLate = validRecords.filter(r => r.status === 'late').length;
    const totalEnrolled = validBatchStudents.length;
    const attendanceRate = totalEnrolled > 0 ? Math.round((totalPresent / totalEnrolled) * 100) : 0;

    const instituteId = currentUser.instituteId || 'INST-MTH-01';
    const nowTimestamp = new Date().toISOString();

    // Check if session already exists for this institute, batch, and date (Prevent duplicate session)
    const existingSession = attendanceSessions.find(
      s => s.instituteId === instituteId && s.batchId === input.batchId && s.sessionDate === input.date
    );

    let savedSession: AttendanceSession;

    if (existingSession) {
      // UPDATE existing session
      savedSession = {
        ...existingSession,
        totalEnrolled,
        totalPresent,
        totalAbsent,
        totalLate,
        attendanceRate,
        notes: input.notes !== undefined ? input.notes : existingSession.notes,
        updatedAt: nowTimestamp,
        updatedByUserName: currentUser.name,
      };

      setAttendanceSessions(prev =>
        prev.map(s => (s.id === existingSession.id ? savedSession : s))
      );

      logAuditEvent('UPDATE_ATTENDANCE', 'attendance', existingSession.id, {
        batchId: input.batchId,
        batchName: batch.name,
        date: input.date,
        totalPresent,
        totalAbsent,
        totalLate,
        previousPresent: existingSession.totalPresent,
        modifiedBy: currentUser.name,
      });
    } else {
      // CREATE new session
      savedSession = {
        id: `SES-${input.date}-${input.batchId}`,
        instituteId,
        institute_id: instituteId,
        batchId: input.batchId,
        sessionDate: input.date,
        markedByUserId: currentUser.id,
        markedByUserName: currentUser.name,
        totalEnrolled,
        totalPresent,
        totalAbsent,
        totalLate,
        attendanceRate,
        notes: input.notes,
        createdAt: nowTimestamp,
        updatedAt: nowTimestamp,
      };

      setAttendanceSessions(prev => [savedSession, ...prev]);

      logAuditEvent('SAVE_ATTENDANCE_SESSION', 'attendance', savedSession.id, {
        batchId: input.batchId,
        batchName: batch.name,
        date: input.date,
        totalPresent,
        totalAbsent,
        totalLate,
        markedBy: currentUser.name,
      });
    }

    // Update DailyAttendanceRecord list without duplicating rows
    const newRecords: DailyAttendanceRecord[] = validRecords.map(r => {
      const student = validBatchStudents.find(s => s.id === r.studentId);
      return {
        id: `ATT-${input.date}-${r.studentId}`,
        instituteId,
        institute_id: instituteId,
        date: input.date,
        batchId: input.batchId,
        studentId: r.studentId,
        studentName: student ? student.fullName : 'Student',
        status: r.status,
        remarks: r.remarks,
        markedBy: existingSession ? existingSession.markedByUserName : currentUser.name,
        updatedBy: currentUser.name,
        updatedAt: nowTimestamp,
        sessionId: savedSession.id,
      };
    });

    setAttendance(prev => {
      const studentIdSet = new Set(validRecords.map(r => r.studentId));
      const filteredPrev = prev.filter(
        a => !(a.date === input.date && studentIdSet.has(a.studentId))
      );
      return [...filteredPrev, ...newRecords];
    });

    if (isSupabaseConfigured) {
      dbSaveAttendanceSession(instituteId, input, currentUser.id)
        .catch(err => console.error('Supabase attendance session save error:', err));
    }

    return { session: savedSession, records: newRecords };
  };

  const getBatchAttendanceRate = (batchId: string): number => {
    const bRecords = attendance.filter(a => a.batchId === batchId);
    if (bRecords.length === 0) return 100;
    const present = bRecords.filter(r => r.status === 'present').length;
    return Math.round((present / bRecords.length) * 100);
  };

  const getStudentAttendanceSummary = (studentId: string): StudentAttendanceSummary => {
    const student = students.find(s => s.id === studentId);
    const sRecords = attendance.filter(a => a.studentId === studentId);
    const presentCount = sRecords.filter(r => r.status === 'present').length;
    const absentCount = sRecords.filter(r => r.status === 'absent').length;
    const lateCount = sRecords.filter(r => r.status === 'late').length;
    const totalClasses = sRecords.length;
    const attendanceRate = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 100;

    return {
      studentId,
      studentCode: student?.studentId || studentId,
      studentName: student?.fullName || 'Unknown Student',
      batchId: student?.batchId || 'UNASSIGNED',
      batchName: student?.batchName || 'Unassigned',
      guardianName: student?.guardianName || 'Guardian',
      guardianPhone: student?.guardianPhone || student?.phone || '',
      totalClasses,
      presentCount,
      absentCount,
      lateCount,
      attendanceRate,
    };
  };

  const getAbsentStudentsForDate = (date: string, batchId?: string) => {
    const absentRecords = attendance.filter(
      a => a.date === date && a.status === 'absent' && (!batchId || batchId === 'ALL' || a.batchId === batchId)
    );

    return absentRecords.map(record => {
      const student = students.find(s => s.id === record.studentId) || {
        id: record.studentId,
        studentId: record.studentId,
        fullName: record.studentName,
        phone: '+91 94120 00000',
        guardianName: 'Guardian',
        guardianPhone: '+91 98370 00000',
        guardianRelation: 'Guardian' as const,
        course: 'Coaching',
        batchId: record.batchId,
        batchName: 'Batch',
        admissionDate: date,
        gender: 'Male' as const,
        status: 'active' as const,
        feeStatus: 'paid' as const,
        totalFeeInvoiced: 0,
        totalFeePaid: 0,
        balanceFee: 0,
        avatarSeed: 'seed',
        instituteId: record.instituteId,
      };
      const batch = batches.find(b => b.id === record.batchId) || batches[0];
      return {
        student,
        batch,
        status: record.status,
        remarks: record.remarks,
      };
    });
  };

  const getDailyAttendanceSummaries = (date: string): DailyAttendanceSummary[] => {
    return batches.map(batch => {
      const bStudents = students.filter(s => s.batchId === batch.id && s.status !== 'archived');
      const session = attendanceSessions.find(s => s.batchId === batch.id && s.sessionDate === date);
      const bRecords = attendance.filter(a => a.batchId === batch.id && a.date === date);

      const totalPresent = session ? session.totalPresent : bRecords.filter(r => r.status === 'present').length;
      const totalAbsent = session ? session.totalAbsent : bRecords.filter(r => r.status === 'absent').length;
      const totalLate = session ? session.totalLate : bRecords.filter(r => r.status === 'late').length;
      const totalEnrolled = bStudents.length;
      const attendanceRate = totalEnrolled > 0 ? Math.round((totalPresent / totalEnrolled) * 100) : 0;

      return {
        date,
        batchId: batch.id,
        batchName: batch.name,
        totalEnrolled,
        totalPresent,
        totalAbsent,
        totalLate,
        attendanceRate,
        markedBy: session ? session.markedByUserName : 'Er. Rakesh Sharma',
        updatedAt: session?.updatedAt,
      };
    });
  };

  const getBatchAttendanceSummaries = (): BatchAttendanceSummary[] => {
    return batches.map(batch => {
      const bStudents = students.filter(s => s.batchId === batch.id && s.status !== 'archived');
      const bSessions = attendanceSessions.filter(s => s.batchId === batch.id);
      const bRecords = attendance.filter(a => a.batchId === batch.id);

      const totalPresentMarks = bRecords.filter(r => r.status === 'present').length;
      const totalAbsentMarks = bRecords.filter(r => r.status === 'absent').length;
      const totalLateMarks = bRecords.filter(r => r.status === 'late').length;
      const totalMarks = bRecords.length;
      const averageAttendanceRate = totalMarks > 0 ? Math.round((totalPresentMarks / totalMarks) * 100) : 100;

      return {
        batchId: batch.id,
        batchName: batch.name,
        course: batch.course,
        instructor: batch.instructor,
        enrolledStudents: bStudents.length,
        totalSessions: bSessions.length || 1,
        averageAttendanceRate,
        totalPresentMarks,
        totalAbsentMarks,
        totalLateMarks,
      };
    });
  };

  const getMonthlyAttendanceSummaries = (): MonthlyAttendanceSummary[] => {
    const totalPresent = attendance.filter(a => a.status === 'present').length;
    const totalAbsent = attendance.filter(a => a.status === 'absent').length;
    const totalLate = attendance.filter(a => a.status === 'late').length;
    const totalRecords = attendance.length;
    const rate = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 85;

    return [
      {
        monthKey: '2026-11',
        monthName: 'November 2026 (Current Academic Session)',
        totalSessionsHeld: attendanceSessions.length || 6,
        averageAttendanceRate: rate,
        totalPresentMarks: totalPresent,
        totalAbsentMarks: totalAbsent,
        totalLateMarks: totalLate,
      },
    ];
  };

  const addFeePlan = (input: CreateFeePlanInput): FeePlan => {
    if (!['owner', 'admin'].includes(currentUser.role)) {
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
      instituteId: currentUser.instituteId || 'INST-MTH-01',
      institute_id: currentUser.instituteId || 'INST-MTH-01',
      name: input.name.trim(),
      category: input.category || 'General Academic',
      amount: Number(input.amount),
      billingFrequency: input.billingFrequency || 'Monthly',
      description: input.description || 'Standard academic fee structure',
      dueDayOfMonth: input.dueDayOfMonth || 10,
      dueDate: input.dueDate,
      maxAuthorizedDiscountPercent: input.maxAuthorizedDiscountPercent || 20,
    };

    setFeePlans(prev => [...prev, newPlan]);
    logAuditEvent('CREATE_FEE_PLAN', 'commercial', newPlan.id, {
      name: newPlan.name,
      amount: newPlan.amount,
      billingFrequency: newPlan.billingFrequency,
    });

    if (isSupabaseConfigured) {
      dbCreateFeePlan(currentUser.instituteId || 'INST-MTH-01', newPlan)
        .catch(err => console.error('Supabase fee plan create error:', err));
    }

    return newPlan;
  };

  const assignFeePlan = (input: AssignFeePlanInput): Student => {
    if (!['owner', 'admin'].includes(currentUser.role)) {
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

    setStudents(prev => prev.map(s => (s.id === student.id ? updatedStudent : s)));

    logAuditEvent('ASSIGN_FEE_PLAN', 'student', student.id, {
      studentName: student.fullName,
      planName: plan.name,
      baseAmount: plan.amount,
      discountAmount: discount,
      netInvoiced,
      newBalance,
    });

    return updatedStudent;
  };

  const recordPayment = ({
    studentId,
    amount,
    paymentMethod,
    paymentDate,
    remarks,
  }: RecordPaymentInput): PaymentTransaction => {
    // 1. Financial Security: Reject negative or non-positive amounts
    if (!amount || isNaN(amount) || amount <= 0) {
      throw new Error('Invalid payment amount. Amount must be a positive number greater than zero.');
    }

    // 2. Financial Security: Role Authorization
    if (!['owner', 'admin'].includes(currentUser.role)) {
      throw new Error('Unauthorized: Only administrators and institute owners can record manual payments.');
    }

    const student = students.find(s => s.id === studentId);
    if (!student) throw new Error('Student not found.');

    const dateToUse = paymentDate && /^\d{4}-\d{2}-\d{2}$/.test(paymentDate) ? paymentDate : todayDate;

    // 3. Financial Security: Duplicate payment prevention
    const isDuplicate = payments.some(
      p =>
        p.studentId === studentId &&
        p.amount === amount &&
        p.paymentDate === dateToUse &&
        p.paymentMethod === paymentMethod &&
        Date.now() - Number(p.id.replace('TXN-', '')) < 3000
    );
    if (isDuplicate) {
      throw new Error('Duplicate payment prevented: An identical transaction was recently recorded.');
    }

    const priorPaid = student.totalFeePaid;
    const invoiced = student.totalFeeInvoiced;
    const newPaid = priorPaid + amount;
    const newBalance = Math.max(0, invoiced - newPaid);

    let newStatus: FeeStatus = 'overdue';
    if (newBalance === 0) newStatus = 'paid';
    else if (newPaid > 0) newStatus = 'partial';

    // Update student
    updateStudent(student.id, {
      totalFeePaid: newPaid,
      balanceFee: newBalance,
      feeStatus: newStatus,
      lastPaymentDate: dateToUse,
    });

    const receiptSeq = payments.length + 89;
    const receiptNumber = `${instituteConfig.receiptPrefix}${receiptSeq.toString().padStart(4, '0')}`;

    const newTxn: PaymentTransaction = {
      id: `TXN-${Date.now()}`,
      instituteId: currentUser.instituteId || 'INST-MTH-01',
      institute_id: currentUser.instituteId || 'INST-MTH-01',
      receiptNumber,
      studentId: student.id,
      studentName: student.fullName,
      batchId: student.batchId,
      batchName: student.batchName,
      amount,
      paymentMethod,
      paymentDate: dateToUse,
      collectedBy: currentUser.name,
      remarks: remarks || `Fee instalment received via ${paymentMethod}`,
      invoicedAmount: invoiced,
      paidAmountPrior: priorPaid,
      balanceRemaining: newBalance,
      status: 'confirmed',
    };

    setPayments(prev => [newTxn, ...prev]);
    setPreviewReceipt(newTxn);

    logAuditEvent('RECORD_PAYMENT', 'payment', newTxn.id, {
      student: student.fullName,
      amount,
      mode: paymentMethod,
      receipt: receiptNumber,
      balanceRemaining: newBalance,
    });

    if (isSupabaseConfigured && student) {
      dbRecordPayment(currentUser.instituteId || 'INST-MTH-01', newTxn, student)
        .catch(err => console.error('Supabase payment recording error:', err));
    }

    return newTxn;
  };

  const reversePayment = (paymentId: string, reason: string): PaymentTransaction => {
    if (!['owner', 'admin'].includes(currentUser.role)) {
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

      updateStudent(student.id, {
        totalFeePaid: revisedPaid,
        balanceFee: revisedBalance,
        feeStatus: revisedStatus,
      });
    }

    const nowIso = new Date().toISOString();
    const updatedTxn: PaymentTransaction = {
      ...txn,
      status: 'reversed',
      reversalReason: reason.trim(),
      reversedAt: nowIso,
    };

    setPayments(prev => prev.map(p => (p.id === paymentId ? updatedTxn : p)));

    logAuditEvent('REVERSE_PAYMENT', 'payment', paymentId, {
      amount: txn.amount,
      reason: reason.trim(),
      receiptNumber: txn.receiptNumber,
      reversedBy: currentUser.name,
      reversedAt: nowIso,
    });

    if (isSupabaseConfigured && student) {
      dbReversePayment(currentUser.instituteId || 'INST-MTH-01', txn, reason, currentUser.id, student)
        .catch(err => console.error('Supabase payment reversal error:', err));
    }

    return updatedTxn;
  };

  const archiveStudent = (id: string) => {
    setStudents(prev =>
      prev.map(s => (s.id === id ? { ...s, status: 'archived' } : s))
    );
    logAuditEvent('ARCHIVE_STUDENT', 'student', id);

    if (isSupabaseConfigured) {
      dbUpdateStudent(currentUser.instituteId || 'INST-MTH-01', id, { status: 'archived' })
        .catch(err => console.error('Supabase student archive error:', err));
    }
  };

  const unarchiveStudent = (id: string) => {
    setStudents(prev =>
      prev.map(s => (s.id === id ? { ...s, status: 'active' } : s))
    );
    logAuditEvent('UNARCHIVE_STUDENT', 'student', id);

    if (isSupabaseConfigured) {
      dbUpdateStudent(currentUser.instituteId || 'INST-MTH-01', id, { status: 'active' })
        .catch(err => console.error('Supabase student unarchive error:', err));
    }
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearAllNotifications = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const addAnnouncement = (
    title: string,
    message: string,
    priority: 'normal' | 'high' = 'normal'
  ): InAppNotification => {
    if (!['owner', 'admin'].includes(currentUser.role)) {
      throw new Error('Unauthorized: Only administrators and owners can broadcast announcements.');
    }
    if (!title.trim() || !message.trim()) {
      throw new Error('Title and announcement message are required.');
    }

    const instId = currentUser.instituteId || 'INST-MTH-01';
    const newNotif: InAppNotification = {
      id: `NOTIF-${Date.now()}`,
      instituteId: instId,
      institute_id: instId,
      title: title.trim(),
      message: message.trim(),
      type: 'announcement',
      priority,
      read: false,
      createdAt: 'Just now',
      actionUrl: '/batches',
    };

    setNotifications(prev => [newNotif, ...prev]);

    logAuditEvent('BROADCAST_ANNOUNCEMENT', 'institute', newNotif.id, {
      title: newNotif.title,
      priority,
      postedBy: currentUser.name,
    });

    return newNotif;
  };

  const updateCommercialSubscription = (updates: Partial<CommercialSubscription>) => {
    setCommercialSubscription(prev => ({ ...prev, ...updates }));
    logAuditEvent('UPDATE_COMMERCIAL_TIER', 'commercial', updates.modelType || 'saas');

    if (isSupabaseConfigured) {
      dbUpdateCommercialSubscription(currentUser.instituteId || 'INST-MTH-01', updates)
        .catch(err => console.error('Supabase commercial subscription update error:', err));
    }
  };

  const logAuditEvent = (
    action: string,
    entityType: 'student' | 'batch' | 'attendance' | 'payment' | 'staff' | 'institute' | 'commercial',
    entityId: string,
    details?: Record<string, any>
  ) => {
    const instId = currentUser.instituteId || 'INST-MTH-01';
    const newLog: AuditLog = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      instituteId: instId,
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      entityType,
      entityId,
      details,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    setAuditLogs(prev => [newLog, ...prev]);

    if (isSupabaseConfigured) {
      dbLogAuditEvent(
        instId,
        currentUser.id,
        action,
        entityType,
        entityId,
        details
      ).catch(err => console.warn('Supabase audit log insert error:', err));
    }
  };

  const updateInstituteConfig = (updates: Partial<InstituteConfig>) => {
    setInstituteConfig(prev => ({ ...prev, ...updates }));
    logAuditEvent('UPDATE_SETTINGS', 'institute', 'INST-MTH-01', updates);
  };

  const addExpense = (input: CreateExpenseInput): Expense => {
    if (!['owner', 'admin'].includes(currentUser.role)) {
      throw new Error('Unauthorized: Only administrators and owners can record institute expenses.');
    }
    if (!input.title?.trim()) {
      throw new Error('Expense title is required.');
    }
    if (input.amount <= 0) {
      throw new Error('Expense amount must be greater than zero.');
    }

    const instId = currentUser.instituteId || 'INST-MTH-01';
    const newExpense: Expense = {
      id: `EXP-${Date.now().toString().slice(-4)}`,
      instituteId: instId,
      institute_id: instId,
      category: input.category,
      amount: input.amount,
      expenseDate: input.expenseDate || todayDate,
      title: input.title.trim(),
      recipient: input.recipient?.trim(),
      paymentMode: input.paymentMode,
      referenceNumber: input.referenceNumber?.trim(),
      notes: input.notes?.trim(),
      receiptVoucherUrl: input.receiptVoucherUrl,
      createdBy: currentUser.id,
      isVoided: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setExpenses(prev => [newExpense, ...prev]);
    logAuditEvent('RECORD_EXPENSE', 'institute', newExpense.id, {
      title: newExpense.title,
      amount: newExpense.amount,
      category: newExpense.category,
    });

    if (isSupabaseConfigured) {
      dbCreateExpense(instId, newExpense, currentUser.id).catch(err =>
        console.error('Supabase create expense error:', err)
      );
    }

    return newExpense;
  };

  const voidExpense = (expenseId: string, reason: string) => {
    if (!['owner', 'admin'].includes(currentUser.role)) {
      throw new Error('Unauthorized: Only administrators and owners can void expenses.');
    }
    if (!reason?.trim()) {
      throw new Error('A void reason must be provided for audit tracking.');
    }

    const instId = currentUser.instituteId || 'INST-MTH-01';
    setExpenses(prev =>
      prev.map(exp =>
        exp.id === expenseId
          ? {
              ...exp,
              isVoided: true,
              voidReason: reason.trim(),
              voidedAt: new Date().toISOString(),
              voidedBy: currentUser.id,
            }
          : exp
      )
    );

    logAuditEvent('VOID_EXPENSE', 'institute', expenseId, { reason });

    if (isSupabaseConfigured) {
      dbVoidExpense(instId, expenseId, reason, currentUser.id).catch(err =>
        console.error('Supabase void expense error:', err)
      );
    }
  };

  const addBatchSchedule = (input: CreateBatchScheduleInput): BatchSchedule => {
    if (!['owner', 'admin'].includes(currentUser.role)) {
      throw new Error('Unauthorized: Only administrators and owners can configure batch schedules.');
    }
    if (input.endTime <= input.startTime) {
      throw new Error('Schedule end time must be after start time.');
    }

    const instId = currentUser.instituteId || 'INST-MTH-01';

    // Room collision check
    if (input.roomNumber && input.roomNumber.trim()) {
      const room = input.roomNumber.trim().toLowerCase();
      const conflict = batchSchedules.find(
        s =>
          s.isActive &&
          s.dayOfWeek === input.dayOfWeek &&
          s.roomNumber &&
          s.roomNumber.trim().toLowerCase() === room &&
          ((input.startTime >= s.startTime && input.startTime < s.endTime) ||
            (input.endTime > s.startTime && input.endTime <= s.endTime) ||
            (input.startTime <= s.startTime && input.endTime >= s.endTime))
      );

      if (conflict) {
        throw new Error(
          `Schedule Conflict: Room "${input.roomNumber}" is already booked on this day between ${conflict.startTime} and ${conflict.endTime}.`
        );
      }
    }

    const newSchedule: BatchSchedule = {
      id: `SCH-${Date.now().toString().slice(-4)}`,
      instituteId: instId,
      institute_id: instId,
      batchId: input.batchId,
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      endTime: input.endTime,
      roomNumber: input.roomNumber?.trim(),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setBatchSchedules(prev => [...prev, newSchedule]);
    logAuditEvent('CREATE_BATCH_SCHEDULE', 'batch', newSchedule.id, {
      batchId: newSchedule.batchId,
      dayOfWeek: newSchedule.dayOfWeek,
      roomNumber: newSchedule.roomNumber,
    });

    if (isSupabaseConfigured) {
      dbCreateBatchSchedule(instId, newSchedule).catch(err =>
        console.error('Supabase create schedule error:', err)
      );
    }

    return newSchedule;
  };

  const deleteBatchSchedule = (scheduleId: string) => {
    if (!['owner', 'admin'].includes(currentUser.role)) {
      throw new Error('Unauthorized: Only administrators and owners can remove batch schedules.');
    }
    const instId = currentUser.instituteId || 'INST-MTH-01';
    setBatchSchedules(prev => prev.filter(s => s.id !== scheduleId));
    logAuditEvent('DELETE_BATCH_SCHEDULE', 'batch', scheduleId);

    if (isSupabaseConfigured) {
      dbDeleteBatchSchedule(instId, scheduleId).catch(err =>
        console.error('Supabase delete schedule error:', err)
      );
    }
  };

  const transferStudentBatch = (studentId: string, newBatchId: string, reason?: string) => {
    if (!['owner', 'admin'].includes(currentUser.role)) {
      throw new Error('Unauthorized: Only administrators and owners can transfer students between batches.');
    }

    const student = students.find(s => s.id === studentId);
    if (!student) throw new Error('Student not found.');

    const newBatch = batches.find(b => b.id === newBatchId);
    if (!newBatch) throw new Error('Target batch not found.');

    if (student.batchId === newBatchId) return;

    const oldBatchId = student.batchId;
    const oldBatchName = student.batchName;
    const instId = currentUser.instituteId || 'INST-MTH-01';

    // Update student's batch assignment
    setStudents(prev =>
      prev.map(s =>
        s.id === studentId
          ? {
              ...s,
              batchId: newBatchId,
              batchName: newBatch.name,
              course: newBatch.course,
            }
          : s
      )
    );

    // Record historical transfer log
    const transferRecord: StudentBatchTransfer = {
      id: `XFR-${Date.now().toString().slice(-4)}`,
      instituteId: instId,
      institute_id: instId,
      studentId,
      studentName: student.fullName,
      fromBatchId: oldBatchId,
      fromBatchName: oldBatchName,
      toBatchId: newBatchId,
      toBatchName: newBatch.name,
      transferDate: todayDate,
      reason: reason || 'Batch transfer requested by administrator',
      transferredBy: currentUser.id,
      createdAt: new Date().toISOString(),
    };

    setBatchTransfers(prev => [transferRecord, ...prev]);

    logAuditEvent('TRANSFER_STUDENT_BATCH', 'student', studentId, {
      fromBatchId: oldBatchId,
      toBatchId: newBatchId,
      reason,
    });

    if (isSupabaseConfigured) {
      dbTransferStudentBatch(instId, studentId, newBatchId, reason).catch(err =>
        console.error('Supabase transfer student batch error:', err)
      );
    }
  };

  // Phase 15: Platform Governance Actions
  const recordPlatformAudit = (
    action: PlatformAuditLog['action'],
    targetInstituteId: string,
    details: Record<string, any>,
    reason: string
  ) => {
    const inst = platformInstitutes.find(i => i.id === targetInstituteId);
    const newLog: PlatformAuditLog = {
      id: `PAUD-${Date.now()}`,
      action,
      targetInstituteId,
      targetInstituteName: inst ? inst.name : targetInstituteId,
      actorEmail: currentUser?.email || 'superadmin@fixia.in',
      actorId: currentUser?.id || 'USR-SUPERADMIN-01',
      details,
      reason,
      timestamp: new Date().toISOString(),
    };
    setPlatformAuditLogs(prev => [newLog, ...prev]);
  };

  const createPlatformInstitute = (input: CreatePlatformInstituteInput): PlatformInstituteRecord => {
    const newId = `INST-${input.city.substring(0, 3).toUpperCase()}-${String(platformInstitutes.length + 1).padStart(2, '0')}`;
    const newSubId = `COMM-SUB-${String(platformInstitutes.length + 1).padStart(2, '0')}`;

    const newSubscription: CommercialSubscription = {
      id: newSubId,
      instituteId: newId,
      modelType: input.modelType,
      planName: input.planName,
      status: input.status === 'trial' ? 'trial' : 'active',
      subscriptionStatus: input.status === 'trial' ? 'trial' : 'active',
      licenceStatus: input.modelType === 'one_time_licence' ? 'active' : 'not_applicable',
      studentLimit: input.studentLimit,
      enabledModules: ['students', 'batches', 'attendance', 'fees', 'expenses', 'timetable', 'reports'],
      billingCycle: input.billingCycle || 'monthly',
      recurringAmount: input.recurringAmount || 1499,
      renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      hostingResponsibility: 'FIXIA Cloud Managed',
      supportEntitlement: '24/7 Priority Support',
      sourceCodeOwnership: false,
    };

    const newInstRecord: PlatformInstituteRecord = {
      id: newId,
      name: input.name,
      category: input.category,
      categoryLabel: input.category,
      city: input.city,
      state: input.state,
      phone: input.directorPhone,
      email: input.directorEmail,
      directorName: input.directorName,
      regNumber: input.regNumber || `REG-${newId}`,
      academicSession: '2026-2027',
      status: input.status || 'active',
      createdAt: new Date().toISOString(),
      studentCount: 0,
      batchCount: 0,
      facultyCount: 1,
      subscription: newSubscription,
    };

    setPlatformInstitutes(prev => [newInstRecord, ...prev]);
    recordPlatformAudit('CREATE_INSTITUTE', newId, { plan: input.planName, limit: input.studentLimit }, 'Super Admin created and provisioned new tenant institute.');
    return newInstRecord;
  };

  const updateInstituteStatus = (
    instituteId: string,
    newStatus: 'active' | 'suspended' | 'trial',
    reason: string
  ) => {
    setPlatformInstitutes(prev =>
      prev.map(inst => {
        if (inst.id === instituteId) {
          return {
            ...inst,
            status: newStatus,
            suspensionReason: newStatus === 'suspended' ? reason : undefined,
          };
        }
        return inst;
      })
    );
    recordPlatformAudit(
      newStatus === 'suspended' ? 'SUSPEND_INSTITUTE' : 'ACTIVATE_INSTITUTE',
      instituteId,
      { status: newStatus },
      reason
    );
  };

  const updateInstituteCommercialPlan = (
    instituteId: string,
    updates: Partial<CommercialSubscription>,
    reason: string
  ) => {
    setPlatformInstitutes(prev =>
      prev.map(inst => {
        if (inst.id === instituteId) {
          const updatedSub = { ...inst.subscription, ...updates };
          return {
            ...inst,
            subscription: updatedSub,
          };
        }
        return inst;
      })
    );

    // If it's the current institute, also update the active commercial subscription
    if (instituteId === instituteConfig.name || instituteId === 'INST-MTH-01') {
      setCommercialSubscription(prev => ({ ...prev, ...updates }));
    }

    recordPlatformAudit('UPDATE_QUOTA', instituteId, updates, reason);
  };

  const issueSoftwareLicense = (input: {
    instituteId: string;
    version: string;
    maxStudents: number;
    offlineSupport: boolean;
  }): SoftwareLicenseRecord => {
    const inst = platformInstitutes.find(i => i.id === input.instituteId);
    const randPart1 = Math.floor(1000 + Math.random() * 9000);
    const randPart2 = Math.floor(1000 + Math.random() * 9000);
    const randPart3 = Math.floor(1000 + Math.random() * 9000);
    const generatedKey = `FIXIA-LIC-${randPart1}-${randPart2}-${randPart3}`;

    const newLicense: SoftwareLicenseRecord = {
      id: `LIC-${Date.now()}`,
      licenseKey: generatedKey,
      instituteId: input.instituteId,
      instituteName: inst ? inst.name : input.instituteId,
      modelType: 'one_time_licence',
      licensedVersion: input.version || 'v2.4.0',
      status: 'active',
      licenseStartDate: new Date().toISOString().split('T')[0],
      maxStudents: input.maxStudents,
      hardwareFingerprint: input.offlineSupport ? `SRV-OFFLINE-${Date.now().toString().slice(-6)}` : undefined,
      offlineChecksum: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      maintenanceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      sourceCodeOwnership: false,
      createdAt: new Date().toISOString(),
      issuedBy: currentUser?.email || 'superadmin@fixia.in',
    };

    setSoftwareLicenses(prev => [newLicense, ...prev]);

    // Also update the institute subscription record with the license key
    setPlatformInstitutes(prev =>
      prev.map(i => {
        if (i.id === input.instituteId) {
          return {
            ...i,
            subscription: {
              ...i.subscription,
              modelType: 'one_time_licence',
              licenceKey: generatedKey,
              licenceStatus: 'active',
              studentLimit: input.maxStudents,
            },
          };
        }
        return i;
      })
    );

    recordPlatformAudit('ISSUE_LICENSE', input.instituteId, { licenseKey: generatedKey, version: input.version }, 'Issued Model B software license key.');
    return newLicense;
  };

  const revokeSoftwareLicense = (licenseId: string, reason: string) => {
    let targetInstId = '';
    setSoftwareLicenses(prev =>
      prev.map(lic => {
        if (lic.id === licenseId) {
          targetInstId = lic.instituteId;
          return { ...lic, status: 'suspended' as const };
        }
        return lic;
      })
    );

    if (targetInstId) {
      setPlatformInstitutes(prev =>
        prev.map(i => {
          if (i.id === targetInstId) {
            return {
              ...i,
              subscription: {
                ...i.subscription,
                licenceStatus: 'suspended',
              },
            };
          }
          return i;
        })
      );
      recordPlatformAudit('REVOKE_LICENSE', targetInstId, { licenseId }, reason);
    }
  };

  const resetToDemoDefaults = () => {
    localStorage.removeItem(`${STORAGE_PREFIX}students`);
    localStorage.removeItem(`${STORAGE_PREFIX}batches`);
    localStorage.removeItem(`${STORAGE_PREFIX}attendance`);
    localStorage.removeItem(`${STORAGE_PREFIX}attendance_sessions`);
    localStorage.removeItem(`${STORAGE_PREFIX}payments`);
    localStorage.removeItem(`${STORAGE_PREFIX}fee_plans`);
    localStorage.removeItem(`${STORAGE_PREFIX}staff`);
    localStorage.removeItem(`${STORAGE_PREFIX}audit_logs`);
    localStorage.removeItem(`${STORAGE_PREFIX}notifications`);
    localStorage.removeItem(`${STORAGE_PREFIX}commercial`);
    localStorage.removeItem(`${STORAGE_PREFIX}config`);
    localStorage.removeItem(`${STORAGE_PREFIX}expenses`);
    localStorage.removeItem(`${STORAGE_PREFIX}schedules`);
    localStorage.removeItem(`${STORAGE_PREFIX}transfers`);

    const freshStudents = generateInitialStudents();
    const freshAttendance = generateInitialAttendance(freshStudents, todayDate);
    setStudents(freshStudents);
    setBatches(INITIAL_BATCHES);
    setAttendance(freshAttendance);
    setAttendanceSessions(generateInitialAttendanceSessions(INITIAL_BATCHES, freshStudents, freshAttendance, todayDate));
    setPayments(INITIAL_PAYMENT_TRANSACTIONS);
    setFeePlans(INITIAL_FEE_PLANS);
    setStaff(INITIAL_STAFF_MEMBERS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setCommercialSubscription(INITIAL_COMMERCIAL_SUBSCRIPTION);
    setExpenses(INITIAL_EXPENSES);
    setBatchSchedules(INITIAL_BATCH_SCHEDULES);
    setBatchTransfers(INITIAL_BATCH_TRANSFERS);
    setInstituteConfig(INITIAL_INSTITUTE_CONFIG);
    setPreviewReceipt(null);
  };

  return (
    <AppContext.Provider
      value={{
        students,
        batches,
        attendance,
        attendanceSessions,
        payments,
        feePlans,
        staff,
        auditLogs,
        notifications,
        commercialSubscription,
        expenses,
        batchSchedules,
        batchTransfers,
        hasModuleAccess,
        instituteConfig,
        dashboardStats,
        todayDate,
        activeAttendanceDate,
        setActiveAttendanceDate,
        selectedBatchIdForAttendance,
        setSelectedBatchIdForAttendance,
        previewReceipt,
        setPreviewReceipt,
        isArchitectureModalOpen,
        setIsArchitectureModalOpen,
        isPaymentModalOpen,
        setIsPaymentModalOpen,
        selectedStudentForPayment,
        setSelectedStudentForPayment,
        isNotificationModalOpen,
        setIsNotificationModalOpen,
        addStudent,
        updateStudent,
        deleteStudent,
        archiveStudent,
        unarchiveStudent,
        addBatch,
        updateBatch,
        deleteBatch,
        assignStudentsToBatch,
        removeStudentFromBatch,
        addStaff,
        updateStaff,
        deleteStaff,
        toggleStaffStatus,
        markAttendance,
        markAllPresent,
        saveAttendanceSession,
        getBatchAttendanceRate,
        getStudentAttendanceSummary,
        getAbsentStudentsForDate,
        getDailyAttendanceSummaries,
        getBatchAttendanceSummaries,
        getMonthlyAttendanceSummaries,
        addFeePlan,
        assignFeePlan,
        recordPayment,
        reversePayment,
        addExpense,
        voidExpense,
        addBatchSchedule,
        deleteBatchSchedule,
        transferStudentBatch,
        markNotificationRead,
        clearAllNotifications,
        deleteNotification,
        addAnnouncement,
        updateCommercialSubscription,
        logAuditEvent,
        // Phase 15: Super Admin Platform
        platformInstitutes,
        softwareLicenses,
        platformAuditLogs,
        createPlatformInstitute,
        updateInstituteStatus,
        updateInstituteCommercialPlan,
        issueSoftwareLicense,
        revokeSoftwareLicense,
        recordPlatformAudit,

        updateInstituteConfig,
        resetToDemoDefaults,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
