export type FeeStatus = 'paid' | 'partial' | 'overdue';

export type PaymentMethod = 'UPI' | 'Cash' | 'Bank Transfer' | 'Cheque';

export type AttendanceStatus = 'present' | 'absent' | 'late';

export type CoachingCategory = 
  | 'academic_k12' 
  | 'engineering_medical' 
  | 'commerce_professional' 
  | 'skills_languages';

export interface Student {
  id: string; // e.g., 'STU-001'
  instituteId: string; // Mandatory Tenant ID (e.g. 'INST-MTH-01')
  institute_id?: string;
  studentId: string; // e.g., 'FIX-2026-001'
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
  guardianName: string;
  guardianPhone: string;
  guardianRelation: 'Father' | 'Mother' | 'Guardian';
  course: string;
  batchId: string;
  batchName: string;
  admissionDate: string; // YYYY-MM-DD
  gender: 'Male' | 'Female' | 'Other';
  status: 'active' | 'archived';
  feeStatus: FeeStatus;
  totalFeeInvoiced: number;
  totalFeePaid: number;
  balanceFee: number;
  lastPaymentDate?: string;
  notes?: string;
  avatarSeed: string;
  feePlanId?: string;
  feePlanName?: string;
  feeDueDate?: string;
  discountAmount?: number;
  discountReason?: string;
}

export interface Batch {
  id: string;
  instituteId: string; // Mandatory Tenant ID
  institute_id?: string;
  name: string;
  code: string;
  course: string;
  instructor: string;
  scheduleDays: string; // e.g. "Mon, Wed, Fri"
  timing: string; // e.g. "04:30 PM - 06:00 PM"
  room: string;
  capacity: number;
  studentCount: number;
  status: 'active' | 'completed' | 'upcoming';
  startDate: string;
  monthlyFee: number;
}

export interface DailyAttendanceRecord {
  id: string;
  instituteId: string; // Mandatory Tenant ID
  institute_id?: string;
  date: string; // YYYY-MM-DD
  batchId: string;
  studentId: string;
  studentName: string;
  status: AttendanceStatus;
  remarks?: string;
  markedBy?: string;
  updatedBy?: string;
  updatedAt?: string;
  sessionId?: string;
}

export interface AttendanceSession {
  id: string;
  instituteId: string;
  institute_id?: string;
  batchId: string;
  sessionDate: string; // YYYY-MM-DD
  markedByUserId: string;
  markedByUserName: string;
  totalEnrolled: number;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  attendanceRate: number; // Percentage (0-100)
  notes?: string;
  createdAt: string;
  updatedAt: string;
  updatedByUserName?: string;
}

export interface SaveAttendanceSessionInput {
  batchId: string;
  date: string;
  records: Array<{
    studentId: string;
    status: AttendanceStatus;
    remarks?: string;
  }>;
  notes?: string;
}

export interface DailyAttendanceSummary {
  date: string;
  batchId: string;
  batchName: string;
  totalEnrolled: number;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  attendanceRate: number;
  markedBy: string;
  updatedAt?: string;
}

export interface BatchAttendanceSummary {
  batchId: string;
  batchName: string;
  course: string;
  instructor: string;
  enrolledStudents: number;
  totalSessions: number;
  averageAttendanceRate: number;
  totalPresentMarks: number;
  totalAbsentMarks: number;
  totalLateMarks: number;
}

export interface StudentAttendanceSummary {
  studentId: string;
  studentCode: string;
  studentName: string;
  batchId: string;
  batchName: string;
  guardianName: string;
  guardianPhone: string;
  totalClasses: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  attendanceRate: number;
}

export interface MonthlyAttendanceSummary {
  monthKey: string; // YYYY-MM
  monthName: string;
  totalSessionsHeld: number;
  averageAttendanceRate: number;
  totalPresentMarks: number;
  totalAbsentMarks: number;
  totalLateMarks: number;
}

export interface PaymentTransaction {
  id: string;
  instituteId: string; // Mandatory Tenant ID
  institute_id?: string;
  receiptNumber: string; // e.g. 'RCP-2026-0042'
  studentId: string;
  studentName: string;
  batchId: string;
  batchName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string; // YYYY-MM-DD
  collectedBy: string;
  remarks?: string;
  invoicedAmount: number;
  paidAmountPrior: number;
  balanceRemaining: number;
  status?: 'confirmed' | 'reversed';
  reversalReason?: string;
  reversedAt?: string;
}

export interface FeePlan {
  id: string;
  instituteId: string; // Mandatory Tenant ID
  institute_id?: string;
  name: string;
  category: string;
  amount: number;
  billingFrequency: 'Monthly' | 'Quarterly' | 'Annual' | 'Full Course' | 'Custom';
  description: string;
  dueDayOfMonth?: number;
  dueDate?: string;
  maxAuthorizedDiscountPercent?: number;
}

export interface CreateFeePlanInput {
  name: string;
  category: string;
  amount: number;
  billingFrequency: 'Monthly' | 'Quarterly' | 'Annual' | 'Full Course' | 'Custom';
  description: string;
  dueDayOfMonth?: number;
  dueDate?: string;
  maxAuthorizedDiscountPercent?: number;
}

export interface AssignFeePlanInput {
  studentId: string;
  planId: string;
  discountAmount?: number;
  discountReason?: string;
  customDueDate?: string;
}

export interface RecordPaymentInput {
  studentId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate?: string;
  remarks?: string;
}

export interface CreateFeePlanInput {
  name: string;
  category: string;
  amount: number;
  billingFrequency: 'Monthly' | 'Quarterly' | 'Annual' | 'Full Course' | 'Custom';
  description: string;
  dueDayOfMonth?: number;
  dueDate?: string;
  maxAuthorizedDiscountPercent?: number;
}

export interface AssignFeePlanInput {
  studentId: string;
  planId: string;
  discountAmount?: number;
  discountReason?: string;
  customDueDate?: string;
}

export interface InstituteConfig {
  name: string;
  tagline: string;
  category: CoachingCategory;
  categoryLabel: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  directorName: string;
  regNumber: string;
  academicSession: string;
  currencySymbol: string;
  receiptPrefix: string;
  whatsappReminderTemplate: string;
}

export type UserRole = 'owner' | 'admin' | 'staff' | 'faculty';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  instituteId: string;
  instituteName: string;
}

export interface StaffMember {
  id: string;
  instituteId: string; // Mandatory Tenant ID
  institute_id?: string;
  name: string;
  email: string;
  phone: string;
  role: 'owner' | 'admin' | 'faculty';
  roleTitle: string;
  subjects?: string[];
  assignedBatchIds: string[];
  joiningDate: string;
  status: 'active' | 'inactive';
}

export interface Membership {
  id: string;
  instituteId: string;
  userId: string;
  role: 'owner' | 'admin' | 'staff';
  roleTitle: string;
  assignedBatches: string[];
  isActive: boolean;
}

export interface AuditLog {
  id: string;
  instituteId: string;
  userId: string;
  userName: string;
  action: string;
  entityType: 'student' | 'batch' | 'attendance' | 'payment' | 'staff' | 'institute' | 'commercial';
  entityId: string;
  details?: Record<string, any>;
  createdAt: string;
}

export type CommercialModelType = 'saas_subscription' | 'one_time_licence' | 'custom_development';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trial' | 'expired' | 'not_applicable';
export type LicenceStatus = 'active' | 'expired' | 'suspended' | 'pending_activation' | 'not_applicable';
export type MilestoneStatus = 'discovery' | 'in_development' | 'testing' | 'delivered' | 'accepted';

export interface CommercialSubscription {
  id: string;
  instituteId: string;
  institute_id?: string;

  // 1. Purchase model
  modelType: CommercialModelType;
  planName: string;

  // 2. Statuses kept strictly separate
  subscriptionStatus?: SubscriptionStatus;
  licenceStatus?: LicenceStatus;
  status: SubscriptionStatus; // Backwards compatibility alias

  // 3. Feature entitlements
  enabledModules: string[];

  // 4. Student limits
  studentLimit: number;

  // 5. Hosting responsibility
  hostingResponsibility: string;

  // 6. Maintenance & Support entitlement
  supportEntitlement: string;
  maintenanceResponsibility?: string;
  upgradeEntitlement?: string;

  // MODEL A — SaaS fields
  setupFeePaid?: number;
  billingCycle?: 'monthly' | 'annual';
  recurringAmount?: number;
  renewalDate?: string;

  // MODEL B — One-Time Licence fields
  licenceKey?: string;
  licensedVersion?: string;
  licencePurchaseFee?: number;
  licenceStartDate?: string;
  licenceExpiryDate?: string;
  sourceCodeOwnership?: boolean; // Always false; explicit legal requirement

  // MODEL C — Custom Development fields
  customRequirements?: string;
  quotationReference?: string;
  quotationAmount?: number;
  definedScope?: string;
  milestoneStatus?: MilestoneStatus;
  deliveryDate?: string;
  deliveryNotes?: string;
  supportAgreement?: string;
  customScopeNotes?: string;
}

export interface InAppNotification {
  id: string;
  instituteId?: string;
  institute_id?: string;
  title: string;
  message: string;
  type: 'fee_due' | 'overdue' | 'attendance_alert' | 'system' | 'announcement';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  targetAudience?: 'all' | 'staff' | 'faculty' | 'admin';
}

export interface DashboardStats {
  totalStudents: number;
  activeBatches: number;
  presentToday: number;
  absentToday: number;
  attendanceRate: number;
  collectedThisMonth: number;
  pendingFees: number;
}
