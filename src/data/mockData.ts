import {
  Student,
  Batch,
  PaymentTransaction,
  DailyAttendanceRecord,
  AttendanceSession,
  FeePlan,
  InstituteConfig,
  UserProfile,
  InAppNotification,
  Expense,
  BatchSchedule,
  StudentBatchTransfer,
  PlatformInstituteRecord,
  SoftwareLicenseRecord,
  PlatformAuditLog,
} from '../types';

export const INITIAL_INSTITUTE_CONFIG: InstituteConfig = {
  name: 'Radha Krishna Academy',
  tagline: 'Mathura’s Premier Science & Board Exam Coaching',
  category: 'academic_k12',
  categoryLabel: 'School Academic & Foundation (Class 9–12)',
  address: 'Shop 14-17, 2nd Floor, Krishna Commercial Complex, Near Birla Temple, Bhuteshwar Road',
  city: 'Mathura',
  state: 'Uttar Pradesh',
  pincode: '281001',
  phone: '+91 98371 42890',
  email: 'director@radhakrishnaacademy.org',
  directorName: 'Er. Rakesh Sharma (M.Tech, Ex-FIITJEE)',
  regNumber: 'UP-MTH-COACH-2022-849',
  academicSession: '2026-2027',
  currencySymbol: '₹',
  receiptPrefix: 'RCP-2026-',
  whatsappReminderTemplate: 'Dear {guardian_name}, this is a gentle reminder from {institute_name}. {student_name} has a pending fee balance of ₹{balance_fee}. Kindly clear the dues by 10th of this month via UPI or at the institute reception. Thank you.',
};

export const DEMO_USERS: UserProfile[] = [
  {
    id: 'USR-01',
    name: 'Er. Rakesh Sharma',
    email: 'rakesh.sharma@fixia.in',
    role: 'owner',
    roleTitle: 'Director & Lead Physics Faculty',
    instituteId: 'INST-MTH-01',
    instituteName: 'Radha Krishna Academy',
  },
  {
    id: 'USR-02',
    name: 'Pooja Verma',
    email: 'pooja.verma@fixia.in',
    role: 'admin',
    roleTitle: 'Front-Desk & Academic Coordinator',
    instituteId: 'INST-MTH-01',
    instituteName: 'Radha Krishna Academy',
  },
  {
    id: 'USR-03',
    name: 'Amit Upadhyay',
    email: 'amit.maths@fixia.in',
    role: 'faculty',
    roleTitle: 'Senior Mathematics Faculty',
    instituteId: 'INST-MTH-01',
    instituteName: 'Radha Krishna Academy',
  },
  {
    id: 'USR-SUPERADMIN-01',
    name: 'Prashant Verma',
    email: 'superadmin@fixia.in',
    role: 'super_admin',
    roleTitle: 'FIXIA Platform Super Admin & Operations Lead',
    instituteId: 'FIXIA-PLATFORM-HQ',
    instituteName: 'FIXIA Cloud Infrastructure',
  },
];

export const INITIAL_STAFF_MEMBERS = [
  {
    id: 'STF-01',
    instituteId: 'INST-MTH-01',
    name: 'Er. Rakesh Sharma',
    email: 'rakesh.sharma@fixia.in',
    phone: '+91 98371 42890',
    role: 'owner' as const,
    roleTitle: 'Director & Lead Physics Faculty',
    subjects: ['Physics', 'JEE Advanced Mechanics'],
    assignedBatchIds: ['BAT-101', 'BAT-102', 'BAT-103'],
    joiningDate: '2018-04-01',
    status: 'active' as const,
  },
  {
    id: 'STF-02',
    instituteId: 'INST-MTH-01',
    name: 'Pooja Verma',
    email: 'pooja.verma@fixia.in',
    phone: '+91 94125 88219',
    role: 'admin' as const,
    roleTitle: 'Front-Desk & Academic Coordinator',
    subjects: ['Administration', 'Admissions Desk'],
    assignedBatchIds: [],
    joiningDate: '2021-07-15',
    status: 'active' as const,
  },
  {
    id: 'STF-03',
    instituteId: 'INST-MTH-01',
    name: 'Amit Upadhyay',
    email: 'amit.maths@fixia.in',
    phone: '+91 98370 19284',
    role: 'faculty' as const,
    roleTitle: 'Senior Mathematics Faculty',
    subjects: ['Mathematics', 'Coordinate Geometry', 'Calculus'],
    assignedBatchIds: ['BAT-101', 'BAT-105'],
    joiningDate: '2019-06-01',
    status: 'active' as const,
  },
  {
    id: 'STF-04',
    instituteId: 'INST-MTH-01',
    name: 'Dr. Sunita Mishra',
    email: 'sunita.biology@fixia.in',
    phone: '+91 97580 44120',
    role: 'faculty' as const,
    roleTitle: 'NEET UG Senior Biology Faculty',
    subjects: ['Zoology', 'Botany', 'Genetics'],
    assignedBatchIds: ['BAT-104'],
    joiningDate: '2022-03-10',
    status: 'active' as const,
  },
  {
    id: 'STF-05',
    instituteId: 'INST-MTH-01',
    name: 'Dr. S. K. Gupta',
    email: 'sk.chemistry@fixia.in',
    phone: '+91 94110 59281',
    role: 'faculty' as const,
    roleTitle: 'Organic & Physical Chemistry Specialist',
    subjects: ['Chemistry', 'Organic Synthesis'],
    assignedBatchIds: ['BAT-103', 'BAT-104'],
    joiningDate: '2020-09-01',
    status: 'active' as const,
  },
  {
    id: 'STF-06',
    instituteId: 'INST-MTH-01',
    name: 'CA Mukund Agarwal',
    email: 'mukund.accounts@fixia.in',
    phone: '+91 98372 77192',
    role: 'faculty' as const,
    roleTitle: 'Commerce & Accountancy Lead',
    subjects: ['Accountancy', 'Economics', 'Business Studies'],
    assignedBatchIds: ['BAT-106'],
    joiningDate: '2023-04-15',
    status: 'active' as const,
  },
  {
    id: 'STF-07',
    instituteId: 'INST-MTH-01',
    name: 'Priya Saxena',
    email: 'priya.science@fixia.in',
    phone: '+91 94560 38291',
    role: 'faculty' as const,
    roleTitle: 'Foundation Science & Olympiad Coach',
    subjects: ['General Science', 'Foundation Maths'],
    assignedBatchIds: ['BAT-105'],
    joiningDate: '2024-01-10',
    status: 'active' as const,
  },
];

export const INITIAL_FEE_PLANS: FeePlan[] = [
  {
    id: 'FP-101',
    instituteId: 'INST-MTH-01',
    name: 'Class 10th CBSE Comprehensive',
    category: 'Class 10 CBSE',
    amount: 2500,
    billingFrequency: 'Monthly',
    description: 'Mathematics, Science & Doubt Clearance Sessions with weekly test series.',
  },
  {
    id: 'FP-102',
    instituteId: 'INST-MTH-01',
    name: 'Class 11th JEE Physics & Chemistry',
    category: 'JEE Foundation',
    amount: 3500,
    billingFrequency: 'Monthly',
    description: 'Advanced problem solving, HC Verma & DC Pandey modules, regular DPPs.',
  },
  {
    id: 'FP-103',
    instituteId: 'INST-MTH-01',
    name: 'Class 12th Board Target 95+',
    category: 'Class 12 Board',
    amount: 3000,
    billingFrequency: 'Monthly',
    description: 'NCERT line-by-line breakdown, 10-year previous papers mastery.',
  },
  {
    id: 'FP-104',
    instituteId: 'INST-MTH-01',
    name: 'NEET UG Intensive Droppers',
    category: 'NEET UG',
    amount: 4500,
    billingFrequency: 'Monthly',
    description: 'Daily 3-hour lecture batches, NCERT booster, OMR test every Sunday.',
  },
  {
    id: 'FP-105',
    instituteId: 'INST-MTH-01',
    name: 'Class 9th Foundation All-Subjects',
    category: 'Class 9 Foundation',
    amount: 2000,
    billingFrequency: 'Monthly',
    description: 'Concept building in Maths & Science, Olympiad & NTSE intro.',
  },
  {
    id: 'FP-106',
    instituteId: 'INST-MTH-01',
    name: 'Class 12th Commerce & Accounts',
    category: 'Commerce',
    amount: 2200,
    billingFrequency: 'Monthly',
    description: 'Accountancy, Economics & Business Studies with practical ledger training.',
  },
];

export const INITIAL_COMMERCIAL_SUBSCRIPTION = {
  id: 'COMM-SUB-01',
  instituteId: 'INST-MTH-01',
  modelType: 'saas_subscription' as const,
  planName: 'Growth Plan (Up to 100 Students)',
  status: 'active' as const,
  subscriptionStatus: 'active' as const,
  licenceStatus: 'not_applicable' as const,
  studentLimit: 100,
  enabledModules: ['students', 'batches', 'attendance', 'fees', 'reports', 'staff', 'commercial'],
  setupFeePaid: 4999,
  billingCycle: 'monthly' as const,
  recurringAmount: 1499,
  renewalDate: '2027-04-01',
  hostingResponsibility: 'FIXIA Cloud (AWS Mumbai ap-south-1)',
  supportEntitlement: '24/7 Priority WhatsApp & Phone Support with Dedicated Account Manager',
  maintenanceResponsibility: 'Managed cloud security patching by FIXIA Infrastructure Team',
  upgradeEntitlement: 'Continuous automated software updates included in active subscription',
  sourceCodeOwnership: false,
  customScopeNotes: 'Tier-2 Pilot Partner: Radha Krishna Academy, Mathura',
};

export const INITIAL_NOTIFICATIONS: InAppNotification[] = [
  {
    id: 'NOTIF-01',
    instituteId: 'INST-MTH-01',
    title: 'Upcoming Fee Due — 10 Nov 2026',
    message: 'Monthly fee cycle dues for 20 students will be payable on 10 November 2026.',
    type: 'fee_due',
    priority: 'normal',
    read: false,
    createdAt: 'Today, 10:00 AM',
    actionUrl: '/fees?filter=pending',
  },
  {
    id: 'NOTIF-02',
    instituteId: 'INST-MTH-01',
    title: 'Overdue Tuition Fees Alert',
    message: '₹18,500 in pending balances outstanding across 20 student accounts. Follow-up recommended.',
    type: 'overdue',
    priority: 'high',
    read: false,
    createdAt: 'Today, 09:15 AM',
    actionUrl: '/fees?filter=pending',
  },
  {
    id: 'NOTIF-03',
    instituteId: 'INST-MTH-01',
    title: 'Daily Attendance Report Compiled',
    message: '72 out of 85 students present today (84.7% attendance). 13 absent notices prepared.',
    type: 'attendance_alert',
    priority: 'normal',
    read: false,
    createdAt: 'Today, 08:30 AM',
    actionUrl: '/attendance',
  },
  {
    id: 'NOTIF-04',
    instituteId: 'INST-MTH-01',
    title: 'Institute Announcement: Mock Test Series 2',
    message: 'CBSE Class 10th All-India Mock Test 2 scheduled for Saturday, 8 Nov 2026 at 09:00 AM.',
    type: 'announcement',
    priority: 'high',
    read: true,
    createdAt: 'Yesterday, 04:00 PM',
    actionUrl: '/batches',
  },
  {
    id: 'NOTIF-05',
    instituteId: 'INST-MTH-01',
    title: 'Faculty Schedule Notice',
    message: 'Special doubt clearing sessions for NEET Droppers batch will be held on Friday afternoon.',
    type: 'announcement',
    priority: 'normal',
    read: true,
    createdAt: '2 Nov 2026, 11:30 AM',
    actionUrl: '/batches',
  },
];

export const INITIAL_AUDIT_LOGS = [
  {
    id: 'LOG-001',
    instituteId: 'INST-MTH-01',
    userId: 'USR-01',
    userName: 'Er. Rakesh Sharma',
    action: 'RECORD_PAYMENT',
    entityType: 'payment' as const,
    entityId: 'TXN-2026-088',
    details: { student: 'Akshat Garg', amount: 3500, mode: 'Cash', receipt: 'RCP-2026-088' },
    createdAt: '2026-11-03 11:45:12',
  },
  {
    id: 'LOG-002',
    instituteId: 'INST-MTH-01',
    userId: 'USR-02',
    userName: 'Pooja Verma',
    action: 'SAVE_ATTENDANCE',
    entityType: 'attendance' as const,
    entityId: 'BAT-101',
    details: { batch: 'Class 10th CBSE', present: 14, absent: 2, date: '2026-11-03' },
    createdAt: '2026-11-03 08:15:30',
  },
  {
    id: 'LOG-003',
    instituteId: 'INST-MTH-01',
    userId: 'USR-01',
    userName: 'Er. Rakesh Sharma',
    action: 'ENROLL_STUDENT',
    entityType: 'student' as const,
    entityId: 'STU-049',
    details: { student: 'Drishya Brijwasi', batch: 'NEET UG Droppers', fee: 18000 },
    createdAt: '2026-11-02 16:30:00',
  },
  {
    id: 'LOG-004',
    instituteId: 'INST-MTH-01',
    userId: 'USR-02',
    userName: 'Pooja Verma',
    action: 'RECORD_PAYMENT',
    entityType: 'payment' as const,
    entityId: 'TXN-2026-087',
    details: { student: 'Aditya Verma', amount: 6000, mode: 'UPI', receipt: 'RCP-2026-087' },
    createdAt: '2026-11-02 14:15:22',
  },
];

export const INITIAL_BATCHES: Batch[] = [
  {
    id: 'BAT-101',
    instituteId: 'INST-MTH-01',
    name: 'Class 10th CBSE - Maths & Science',
    code: 'CBSE-10-MORN',
    course: 'Class 10 CBSE Board',
    instructor: 'Er. Rakesh Sharma & Amit Upadhyay',
    scheduleDays: 'Mon, Wed, Fri, Sat',
    timing: '06:30 AM - 08:00 AM',
    room: 'Hall A (Ground Floor)',
    capacity: 20,
    studentCount: 16,
    status: 'active',
    startDate: '2026-04-01',
    monthlyFee: 2500,
  },
  {
    id: 'BAT-102',
    instituteId: 'INST-MTH-01',
    name: 'Class 11th - JEE Foundation Physics',
    code: 'JEE-11-EVE',
    course: 'JEE Main & Advanced 2027',
    instructor: 'Er. Rakesh Sharma',
    scheduleDays: 'Mon, Tue, Thu, Fri',
    timing: '04:30 PM - 06:00 PM',
    room: 'Hall B (Smart Classroom)',
    capacity: 18,
    studentCount: 15,
    status: 'active',
    startDate: '2026-04-10',
    monthlyFee: 3500,
  },
  {
    id: 'BAT-103',
    instituteId: 'INST-MTH-01',
    name: 'Class 12th - Board Exam Physics & Chem',
    code: 'CBSE-12-BOARD',
    course: 'Class 12 Board Target 2026',
    instructor: 'Er. Rakesh Sharma & Dr. S. K. Gupta',
    scheduleDays: 'Tue, Thu, Sat',
    timing: '03:00 PM - 04:30 PM',
    room: 'Hall A (Ground Floor)',
    capacity: 20,
    studentCount: 18,
    status: 'active',
    startDate: '2026-03-15',
    monthlyFee: 3000,
  },
  {
    id: 'BAT-104',
    instituteId: 'INST-MTH-01',
    name: 'NEET UG Droppers - Intensive Batch',
    code: 'NEET-DROP-INT',
    course: 'NEET 2027 Target',
    instructor: 'Dr. Sunita Mishra & Er. Rakesh Sharma',
    scheduleDays: 'Mon to Sat',
    timing: '09:00 AM - 12:30 PM',
    room: 'Lab Room 2',
    capacity: 15,
    studentCount: 14,
    status: 'active',
    startDate: '2026-05-01',
    monthlyFee: 4500,
  },
  {
    id: 'BAT-105',
    instituteId: 'INST-MTH-01',
    name: 'Class 9th CBSE - Foundation All Subjects',
    code: 'CBSE-09-EVE',
    course: 'Class 9 School Foundation',
    instructor: 'Amit Upadhyay & Priya Saxena',
    scheduleDays: 'Mon, Wed, Fri',
    timing: '05:00 PM - 06:30 PM',
    room: 'Room C (1st Floor)',
    capacity: 15,
    studentCount: 12,
    status: 'active',
    startDate: '2026-04-15',
    monthlyFee: 2000,
  },
  {
    id: 'BAT-106',
    instituteId: 'INST-MTH-01',
    name: 'Class 12th Commerce & Accountancy',
    code: 'COMM-12-MORN',
    course: 'Class 12 Commerce & Accounts',
    instructor: 'CA Mukund Agarwal',
    scheduleDays: 'Tue, Thu, Sat',
    timing: '07:30 AM - 09:00 AM',
    room: 'Room C (1st Floor)',
    capacity: 15,
    studentCount: 10,
    status: 'active',
    startDate: '2026-04-05',
    monthlyFee: 2200,
  },
];

// Helper to generate the exact 85 realistic students
// Breakdown:
// Batch 1: 16 students
// Batch 2: 15 students
// Batch 3: 18 students
// Batch 4: 14 students
// Batch 5: 12 students
// Batch 6: 10 students
// Total: 85 students!

// Fee dues distribution: Exactly ₹18,500 total pending across institute
// We will assign specific balance values to 20 students with dues:
// 12 'partial' students:
//   - 4 students with ₹1,000 balance (4,000)
//   - 4 students with ₹1,500 balance (6,000)
//   - 4 students with ₹500 balance   (2,000)
//   Subtotal = ₹12,000
// 8 'overdue' students:
//   - 3 students with ₹1,000 balance (3,000)
//   - 2 students with ₹1,500 balance (3,000)
//   - 1 student with ₹500 balance     (500)
//   Total pending = 12,000 + 3,000 + 3,000 + 500 = ₹18,500! Exactly ₹18,500!

interface RawStudentSpec {
  name: string;
  gender: 'Male' | 'Female';
  guardian: string;
  relation: 'Father' | 'Mother' | 'Guardian';
  area: string;
  phoneSuffix: string;
}

const RAW_NAMES: RawStudentSpec[] = [
  // Batch 101: 16 students
  { name: 'Aarav Sharma', gender: 'Male', guardian: 'Ramesh Sharma', relation: 'Father', area: 'Krishna Nagar', phoneSuffix: '4912' },
  { name: 'Diya Patel', gender: 'Female', guardian: 'Suresh Patel', relation: 'Father', area: 'Dampier Nagar', phoneSuffix: '8214' },
  { name: 'Krishna Agarwal', gender: 'Male', guardian: 'Manoj Agarwal', relation: 'Father', area: 'Birla Temple Road', phoneSuffix: '9012' },
  { name: 'Radhika Khandelwal', gender: 'Female', guardian: 'Sunita Khandelwal', relation: 'Mother', area: 'Radha Nagar', phoneSuffix: '3142' },
  { name: 'Aditya Verma', gender: 'Male', guardian: 'Ashok Verma', relation: 'Father', area: 'Govind Nagar', phoneSuffix: '5129' },
  { name: 'Ananya Mishra', gender: 'Female', guardian: 'Pradeep Mishra', relation: 'Father', area: 'Bhuteshwar', phoneSuffix: '6721' },
  { name: 'Rohan Gupta', gender: 'Male', guardian: 'Sanjay Gupta', relation: 'Father', area: 'Highway City', phoneSuffix: '1849' },
  { name: 'Isha Choudhary', gender: 'Female', guardian: 'Dinesh Choudhary', relation: 'Father', area: 'Vrindavan Gate', phoneSuffix: '9921' },
  { name: 'Ishaan Chaturvedi', gender: 'Male', guardian: 'Girraj Chaturvedi', relation: 'Father', area: 'Chaumuhan', phoneSuffix: '7721' },
  { name: 'Sneha Goswami', gender: 'Female', guardian: 'Brijesh Goswami', relation: 'Father', area: 'Raman Reti', phoneSuffix: '6612' },
  { name: 'Harshit Bansal', gender: 'Male', guardian: 'Pramod Bansal', relation: 'Father', area: 'Civil Lines', phoneSuffix: '8834' },
  { name: 'Tanya Saxena', gender: 'Female', guardian: 'Kavita Saxena', relation: 'Mother', area: 'Kalyan Nagar', phoneSuffix: '2291' },
  { name: 'Varun Soni', gender: 'Male', guardian: 'Kamal Soni', relation: 'Father', area: 'Sadar Bazar', phoneSuffix: '4412' },
  { name: 'Riya Gautam', gender: 'Female', guardian: 'Mukesh Gautam', relation: 'Father', area: 'Mandi Ramdas', phoneSuffix: '3318' },
  { name: 'Yash Upadhyay', gender: 'Male', guardian: 'Hariom Upadhyay', relation: 'Father', area: 'Deeg Gate', phoneSuffix: '7729' },
  { name: 'Khushi Singhal', gender: 'Female', guardian: 'Alok Singhal', relation: 'Father', area: 'Bankey Bihari Colony', phoneSuffix: '5510' },

  // Batch 102: 15 students
  { name: 'Aryan Mathur', gender: 'Male', guardian: 'Deepak Mathur', relation: 'Father', area: 'Krishna Nagar', phoneSuffix: '9123' },
  { name: 'Mansi Rawat', gender: 'Female', guardian: 'Gopal Rawat', relation: 'Father', area: 'Vrindavan', phoneSuffix: '8124' },
  { name: 'Gaurav Pachauri', gender: 'Male', guardian: 'Hemant Pachauri', relation: 'Father', area: 'Ganesh Tila', phoneSuffix: '7125' },
  { name: 'Pooja Tiwari', gender: 'Female', guardian: 'Vandana Tiwari', relation: 'Mother', area: 'Surya Nagar', phoneSuffix: '6126' },
  { name: 'Shivam Dixit', gender: 'Male', guardian: 'Naveen Dixit', relation: 'Father', area: 'Dampier Nagar', phoneSuffix: '5127' },
  { name: 'Bhavna Rajput', gender: 'Female', guardian: 'Rajveer Rajput', relation: 'Father', area: 'BSA College Road', phoneSuffix: '4128' },
  { name: 'Mayank Lodhi', gender: 'Male', guardian: 'Satish Lodhi', relation: 'Father', area: 'Vrindavan Chhatikara', phoneSuffix: '3129' },
  { name: 'Kavya Saraswat', gender: 'Female', guardian: 'Vinod Saraswat', relation: 'Father', area: 'Chowk Bazar', phoneSuffix: '2130' },
  { name: 'Abhishek Jha', gender: 'Male', guardian: 'Ajay Jha', relation: 'Father', area: 'Paltan Bazar', phoneSuffix: '1131' },
  { name: 'Nandini Yadav', gender: 'Female', guardian: 'Umesh Yadav', relation: 'Father', area: 'Jaysinghpura', phoneSuffix: '0132' },
  { name: 'Karan Kaushik', gender: 'Male', guardian: 'Bipin Kaushik', relation: 'Father', area: 'Vrindavan Parikrama', phoneSuffix: '9233' },
  { name: 'Deepika Sen', gender: 'Female', guardian: 'Arun Sen', relation: 'Father', area: 'Radha Kund Road', phoneSuffix: '8234' },
  { name: 'Nikhil Chauhan', gender: 'Male', guardian: 'Mahesh Chauhan', relation: 'Father', area: 'Govardhan Chauraha', phoneSuffix: '7235' },
  { name: 'Avani Bhardwaj', gender: 'Female', guardian: 'Shashi Bhardwaj', relation: 'Mother', area: 'Masani Link Road', phoneSuffix: '6236' },
  { name: 'Ayush Pandey', gender: 'Male', guardian: 'Sudhir Pandey', relation: 'Father', area: 'Civil Lines', phoneSuffix: '5237' },

  // Batch 103: 18 students
  { name: 'Devendra Sikarwar', gender: 'Male', guardian: 'Jagdish Sikarwar', relation: 'Father', area: 'Krishna Nagar', phoneSuffix: '4238' },
  { name: 'Mehak Agnihotri', gender: 'Female', guardian: 'Anil Agnihotri', relation: 'Father', area: 'Dampier Nagar', phoneSuffix: '3239' },
  { name: 'Chirag Mittal', gender: 'Male', guardian: 'Naresh Mittal', relation: 'Father', area: 'Bhuteshwar', phoneSuffix: '2240' },
  { name: 'Tanvi Kulshrestha', gender: 'Female', guardian: 'Poonam Kulshrestha', relation: 'Mother', area: 'Shanti Nagar', phoneSuffix: '1241' },
  { name: 'Prateek Goyal', gender: 'Male', guardian: 'Sunil Goyal', relation: 'Father', area: 'Holi Gate', phoneSuffix: '0242' },
  { name: 'Shreya Vashishtha', gender: 'Female', guardian: 'Lalit Vashishtha', relation: 'Father', area: 'Vrindavan Road', phoneSuffix: '9343' },
  { name: 'Udit Narang', gender: 'Male', guardian: 'Harish Narang', relation: 'Father', area: 'Railway Colony', phoneSuffix: '8344' },
  { name: 'Anushka Dubey', gender: 'Female', guardian: 'Santosh Dubey', relation: 'Father', area: 'Mahavidya Colony', phoneSuffix: '7345' },
  { name: 'Kartik Somani', gender: 'Male', guardian: 'Vishnu Somani', relation: 'Father', area: 'Chowk Bazar', phoneSuffix: '6346' },
  { name: 'Riddhima Shukla', gender: 'Female', guardian: 'Rani Shukla', relation: 'Mother', area: 'Radha Puram', phoneSuffix: '5347' },
  { name: 'Himanshu Tomar', gender: 'Male', guardian: 'Devendra Tomar', relation: 'Father', area: 'Yamuna Paar', phoneSuffix: '4348' },
  { name: 'Payal Khandelwal', gender: 'Female', guardian: 'Rajendra Khandelwal', relation: 'Father', area: 'Dampier Nagar', phoneSuffix: '3349' },
  { name: 'Lalit Kushwaha', gender: 'Male', guardian: 'Bablu Kushwaha', relation: 'Father', area: 'Aurangabad', phoneSuffix: '2350' },
  { name: 'Simran Baghel', gender: 'Female', guardian: 'Dharmendra Baghel', relation: 'Father', area: 'Krishna Nagar', phoneSuffix: '1351' },
  { name: 'Manish Chahar', gender: 'Male', guardian: 'Virendra Chahar', relation: 'Father', area: 'Chhatikara', phoneSuffix: '0352' },
  { name: 'Garima Pathak', gender: 'Female', guardian: 'Rekha Pathak', relation: 'Mother', area: 'Gita Enclave', phoneSuffix: '9453' },
  { name: 'Sumit Jaat', gender: 'Male', guardian: 'Tejpal Jaat', relation: 'Father', area: 'Govind Nagar', phoneSuffix: '8454' },
  { name: 'Muskan Maheshwari', gender: 'Female', guardian: 'Pankaj Maheshwari', relation: 'Father', area: 'Birla Temple', phoneSuffix: '7455' },

  // Batch 104: 14 students
  { name: 'Drishya Brijwasi', gender: 'Female', guardian: 'Kunjbihari Brijwasi', relation: 'Father', area: 'Vrindavan Raman Reti', phoneSuffix: '6456' },
  { name: 'Sankalp Gautam', gender: 'Male', guardian: 'Dauji Gautam', relation: 'Father', area: 'Govardhan', phoneSuffix: '5457' },
  { name: 'Prachi Varshney', gender: 'Female', guardian: 'Mukul Varshney', relation: 'Father', area: 'Holi Gate', phoneSuffix: '4458' },
  { name: 'Naveen Goswami', gender: 'Male', guardian: 'Chaitanya Goswami', relation: 'Father', area: 'Vrindavan Gaushala', phoneSuffix: '3459' },
  { name: 'Bhoomika Tiwari', gender: 'Female', guardian: 'Vibha Tiwari', relation: 'Mother', area: 'Dampier Nagar', phoneSuffix: '2460' },
  { name: 'Sourabh Mudgal', gender: 'Male', guardian: 'Radheshyam Mudgal', relation: 'Father', area: 'Chaumuha', phoneSuffix: '1461' },
  { name: 'Ritika Koli', gender: 'Female', guardian: 'Ramji Lal Koli', relation: 'Father', area: 'Maholi Road', phoneSuffix: '0462' },
  { name: 'Tushar Jadon', gender: 'Male', guardian: 'Manvendra Jadon', relation: 'Father', area: 'Refinery Township', phoneSuffix: '9563' },
  { name: 'Divyanshi Saraswat', gender: 'Female', guardian: 'Narendra Saraswat', relation: 'Father', area: 'Krishna Nagar', phoneSuffix: '8564' },
  { name: 'Vishal Dhakad', gender: 'Male', guardian: 'Bhoop Singh Dhakad', relation: 'Father', area: 'Chhota Kosi', phoneSuffix: '7565' },
  { name: 'Prerna Chaturvedi', gender: 'Female', guardian: 'Shyam Chaturvedi', relation: 'Father', area: 'Gau Ghat', phoneSuffix: '6566' },
  { name: 'Keshav Poddar', gender: 'Male', guardian: 'Girdhari Poddar', relation: 'Father', area: 'Radha Kund', phoneSuffix: '5567' },
  { name: 'Aastha Trivedi', gender: 'Female', guardian: 'Archana Trivedi', relation: 'Mother', area: 'Chhata Road', phoneSuffix: '4568' },
  { name: 'Gopal Krishan Vyas', gender: 'Male', guardian: 'Madhav Vyas', relation: 'Father', area: 'Vrindavan Sewa Kunj', phoneSuffix: '3569' },

  // Batch 105: 12 students
  { name: 'Tanmay Paliwal', gender: 'Male', guardian: 'Omprakash Paliwal', relation: 'Father', area: 'Bhuteshwar', phoneSuffix: '2570' },
  { name: 'Ishita Rawal', gender: 'Female', guardian: 'Brijkishore Rawal', relation: 'Father', area: 'Highway Colony', phoneSuffix: '1571' },
  { name: 'Lakshya Khandelwal', gender: 'Male', guardian: 'Vivek Khandelwal', relation: 'Father', area: 'Radha Puram', phoneSuffix: '0572' },
  { name: 'Jhanvi Chaudhary', gender: 'Female', guardian: 'Bhagwan Singh', relation: 'Father', area: 'Goverdhan Road', phoneSuffix: '9673' },
  { name: 'Daksh Sharma', gender: 'Male', guardian: 'Rohit Sharma', relation: 'Father', area: 'Krishna Nagar', phoneSuffix: '8674' },
  { name: 'Palak Agrawal', gender: 'Female', guardian: 'Amit Agrawal', relation: 'Father', area: 'Surya Nagar', phoneSuffix: '7675' },
  { name: 'Kushagra Soni', gender: 'Male', guardian: 'Vinay Soni', relation: 'Father', area: 'Mandi Ramdas', phoneSuffix: '6676' },
  { name: 'Vanshika Upadhyay', gender: 'Female', guardian: 'Sarita Upadhyay', relation: 'Mother', area: 'Civil Lines', phoneSuffix: '5677' },
  { name: 'Samar Pratap Singh', gender: 'Male', guardian: 'Raghavendra Singh', relation: 'Father', area: 'Masani', phoneSuffix: '4678' },
  { name: 'Kriti Maheshwari', gender: 'Female', guardian: 'Manoj Maheshwari', relation: 'Father', area: 'Birla Temple', phoneSuffix: '3679' },
  { name: 'Ronit Sen', gender: 'Male', guardian: 'Kapil Sen', relation: 'Father', area: 'Dampier Nagar', phoneSuffix: '2680' },
  { name: 'Anvi Dixit', gender: 'Female', guardian: 'Vijay Dixit', relation: 'Father', area: 'Ganesh Tila', phoneSuffix: '1681' },

  // Batch 106: 10 students
  { name: 'Dhruv Singhal', gender: 'Male', guardian: 'Suresh Singhal', relation: 'Father', area: 'Chowk Bazar', phoneSuffix: '0682' },
  { name: 'Manya Gupta', gender: 'Female', guardian: 'Deepa Gupta', relation: 'Mother', area: 'Holi Gate', phoneSuffix: '9783' },
  { name: 'Akshat Garg', gender: 'Male', guardian: 'Pawan Garg', relation: 'Father', area: 'Krishna Nagar', phoneSuffix: '8784' },
  { name: 'Lavanya Goyal', gender: 'Female', guardian: 'Rajesh Goyal', relation: 'Father', area: 'Bhuteshwar', phoneSuffix: '7785' },
  { name: 'Rachit Jain', gender: 'Male', guardian: 'Mukesh Jain', relation: 'Father', area: 'Dampier Nagar', phoneSuffix: '6786' },
  { name: 'Poorvi Khandelwal', gender: 'Female', guardian: 'Anand Khandelwal', relation: 'Father', area: 'Radha Puram', phoneSuffix: '5787' },
  { name: 'Manan Mittal', gender: 'Male', guardian: 'Sunil Mittal', relation: 'Father', area: 'Highway City', phoneSuffix: '4788' },
  { name: 'Suhani Bansal', gender: 'Female', guardian: 'Geeta Bansal', relation: 'Mother', area: 'Birla Temple Road', phoneSuffix: '3789' },
  { name: 'Vansh Agarwal', gender: 'Male', guardian: 'Pradeep Agarwal', relation: 'Father', area: 'Civil Lines', phoneSuffix: '2790' },
  { name: 'Chhavi Sharma', gender: 'Female', guardian: 'Kamlesh Sharma', relation: 'Father', area: 'Govind Nagar', phoneSuffix: '1791' },
];

// Helper to determine fee status and balances totaling exactly ₹18,500
function getFeeDetailsForIndex(index: number, monthlyFee: number): {
  feeStatus: 'paid' | 'partial' | 'overdue';
  totalInvoiced: number;
  totalPaid: number;
  balanceFee: number;
  lastPaymentDate: string;
} {
  // Let total semester/invoiced fee be 4 months of monthlyFee
  const totalInvoiced = monthlyFee * 4;

  // Specific indexes for pending dues (total 20 students with dues):
  // Partial: index 4, 7, 10, 18, 22, 27, 34, 40, 48, 55, 62, 70 (12 students)
  // Overdue: index 12, 19, 29, 38, 45, 59, 68, 77 (8 students)
  // All other 65 students: 'paid' (balance: 0)

  // Desired balance distribution to hit exact ₹18,500:
  // Partials (12 students):
  // 4 students @ 1,000 = 4,000
  // 4 students @ 1,500 = 6,000
  // 4 students @ 500 = 2,000
  // Partial subtotal = 12,000

  // Overdue (8 students):
  // 3 students @ 1,000 = 3,000
  // 2 students @ 1,500 = 3,000
  // 1 student @ 500 = 500
  // Overdue subtotal = 6,500
  // Total pending = 12,000 + 6,500 = 18,500!

  const partialMap: Record<number, number> = {
    4: 1000, 7: 1500, 10: 500,
    18: 1000, 22: 1500, 27: 500,
    34: 1000, 40: 1500, 48: 500,
    55: 1000, 62: 1500, 70: 500
  };

  const overdueMap: Record<number, number> = {
    12: 1000,
    19: 1000,
    29: 1000,
    38: 1000,
    45: 1000,
    59: 500,
    68: 500,
    77: 500
  };

  if (partialMap[index] !== undefined) {
    const bal = partialMap[index];
    return {
      feeStatus: 'partial',
      totalInvoiced,
      totalPaid: totalInvoiced - bal,
      balanceFee: bal,
      lastPaymentDate: '2026-10-15',
    };
  }

  if (overdueMap[index] !== undefined) {
    const bal = overdueMap[index];
    return {
      feeStatus: 'overdue',
      totalInvoiced,
      totalPaid: totalInvoiced - bal,
      balanceFee: bal,
      lastPaymentDate: '2026-09-10',
    };
  }

  // Fully paid
  return {
    feeStatus: 'paid',
    totalInvoiced,
    totalPaid: totalInvoiced,
    balanceFee: 0,
    lastPaymentDate: '2026-11-01',
  };
}

export function generateInitialStudents(): Student[] {
  const students: Student[] = [];
  
  // Batch allocation counts: 16, 15, 18, 14, 12, 10
  const batchMapping = [
    { batch: INITIAL_BATCHES[0], count: 16 },
    { batch: INITIAL_BATCHES[1], count: 15 },
    { batch: INITIAL_BATCHES[2], count: 18 },
    { batch: INITIAL_BATCHES[3], count: 14 },
    { batch: INITIAL_BATCHES[4], count: 12 },
    { batch: INITIAL_BATCHES[5], count: 10 },
  ];

  let nameCursor = 0;

  batchMapping.forEach(({ batch, count }) => {
    for (let i = 0; i < count; i++) {
      const raw = RAW_NAMES[nameCursor];
      const seq = nameCursor + 1;
      const studentIdNum = seq.toString().padStart(3, '0');
      const feeDetails = getFeeDetailsForIndex(nameCursor, batch.monthlyFee);

      students.push({
        id: `STU-${studentIdNum}`,
        instituteId: 'INST-MTH-01',
        institute_id: 'INST-MTH-01',
        studentId: `FIX-MTH-26-${studentIdNum}`,
        fullName: raw.name,
        phone: `+91 94120 ${raw.phoneSuffix}`,
        guardianName: raw.guardian,
        guardianPhone: `+91 98370 ${raw.phoneSuffix}`,
        guardianRelation: raw.relation,
        course: batch.course,
        batchId: batch.id,
        batchName: batch.name,
        admissionDate: '2026-04-05',
        gender: raw.gender,
        status: 'active',
        email: `${raw.name.toLowerCase().replace(/\s+/g, '.')}@student.rka.org`,
        address: `${raw.area}, Mathura, U.P.`,
        feeStatus: feeDetails.feeStatus,
        totalFeeInvoiced: feeDetails.totalInvoiced,
        totalFeePaid: feeDetails.totalPaid,
        balanceFee: feeDetails.balanceFee,
        lastPaymentDate: feeDetails.lastPaymentDate,
        notes: `Resident of ${raw.area}, Mathura. Enrolled for regular coaching and test series.`,
        avatarSeed: raw.name.toLowerCase().replace(/\s+/g, '-'),
      });

      nameCursor++;
    }
  });

  return students;
}

// Exactly 13 absent indices out of 85 to produce:
// 72 Present, 13 Absent today!
export const ABSENT_STUDENT_INDICES = [3, 9, 14, 21, 28, 35, 42, 51, 58, 65, 71, 79, 83];

export function generateInitialAttendance(students: Student[], dateString: string): DailyAttendanceRecord[] {
  return students.map((stu, idx) => {
    const isAbsent = ABSENT_STUDENT_INDICES.includes(idx);
    return {
      id: `ATT-${dateString}-${stu.id}`,
      instituteId: stu.instituteId || 'INST-MTH-01',
      date: dateString,
      batchId: stu.batchId,
      studentId: stu.id,
      studentName: stu.fullName,
      status: isAbsent ? 'absent' : 'present',
      remarks: isAbsent ? 'Informed leave / unwell' : undefined,
      markedBy: 'Er. Rakesh Sharma',
      updatedAt: `${dateString} 08:30:00`,
      sessionId: `SES-${dateString}-${stu.batchId}`,
    };
  });
}

export function generateInitialAttendanceSessions(
  batches: Batch[],
  students: Student[],
  attendance: DailyAttendanceRecord[],
  dateString: string
): AttendanceSession[] {
  return batches.map(batch => {
    const bStudents = students.filter(s => s.batchId === batch.id);
    const bRecords = attendance.filter(a => a.batchId === batch.id && a.date === dateString);
    const totalPresent = bRecords.filter(r => r.status === 'present').length;
    const totalAbsent = bRecords.filter(r => r.status === 'absent').length;
    const totalLate = bRecords.filter(r => r.status === 'late').length;
    const attendanceRate = bStudents.length > 0 ? Math.round((totalPresent / bStudents.length) * 100) : 0;

    return {
      id: `SES-${dateString}-${batch.id}`,
      instituteId: batch.instituteId || 'INST-MTH-01',
      institute_id: batch.instituteId || 'INST-MTH-01',
      batchId: batch.id,
      sessionDate: dateString,
      markedByUserId: 'USR-01',
      markedByUserName: 'Er. Rakesh Sharma',
      totalEnrolled: bStudents.length,
      totalPresent,
      totalAbsent,
      totalLate,
      attendanceRate,
      notes: `Morning lecture & attendance completed for ${batch.name}`,
      createdAt: `${dateString} 08:00:00`,
      updatedAt: `${dateString} 08:30:00`,
    };
  });
}

// Exactly ₹32,000 collected this month:
// 5000 + 3500 + 4000 + 2500 + 4500 + 3000 + 6000 + 3500 = 32,000!
export const INITIAL_PAYMENT_TRANSACTIONS: PaymentTransaction[] = [
  {
    id: 'TXN-2026-081',
    instituteId: 'INST-MTH-01',
    receiptNumber: 'RCP-2026-081',
    studentId: 'STU-001',
    studentName: 'Aarav Sharma',
    batchId: 'BAT-101',
    batchName: 'Class 10th CBSE - Maths & Science',
    amount: 5000,
    paymentMethod: 'UPI',
    paymentDate: '2026-11-01',
    collectedBy: 'Pooja Verma (Reception)',
    remarks: 'Term 2 Tuition Fee Instalment (Google Pay)',
    invoicedAmount: 10000,
    paidAmountPrior: 5000,
    balanceRemaining: 0,
  },
  {
    id: 'TXN-2026-082',
    instituteId: 'INST-MTH-01',
    receiptNumber: 'RCP-2026-082',
    studentId: 'STU-002',
    studentName: 'Diya Patel',
    batchId: 'BAT-101',
    batchName: 'Class 10th CBSE - Maths & Science',
    amount: 3500,
    paymentMethod: 'Cash',
    paymentDate: '2026-11-01',
    collectedBy: 'Er. Rakesh Sharma',
    remarks: 'Received cash at institute desk',
    invoicedAmount: 10000,
    paidAmountPrior: 6500,
    balanceRemaining: 0,
  },
  {
    id: 'TXN-2026-083',
    instituteId: 'INST-MTH-01',
    receiptNumber: 'RCP-2026-083',
    studentId: 'STU-017',
    studentName: 'Aryan Mathur',
    batchId: 'BAT-102',
    batchName: 'Class 11th - JEE Foundation Physics',
    amount: 4000,
    paymentMethod: 'UPI',
    paymentDate: '2026-11-02',
    collectedBy: 'Pooja Verma (Reception)',
    remarks: 'November Monthly Fee (PhonePe Ref #72810)',
    invoicedAmount: 14000,
    paidAmountPrior: 10000,
    balanceRemaining: 0,
  },
  {
    id: 'TXN-2026-084',
    instituteId: 'INST-MTH-01',
    receiptNumber: 'RCP-2026-084',
    studentId: 'STU-006',
    studentName: 'Ananya Mishra',
    batchId: 'BAT-101',
    batchName: 'Class 10th CBSE - Maths & Science',
    amount: 2500,
    paymentMethod: 'UPI',
    paymentDate: '2026-11-02',
    collectedBy: 'Pooja Verma (Reception)',
    remarks: 'Partial Payment via Paytm UPI',
    invoicedAmount: 10000,
    paidAmountPrior: 6500,
    balanceRemaining: 1000,
  },
  {
    id: 'TXN-2026-085',
    instituteId: 'INST-MTH-01',
    receiptNumber: 'RCP-2026-085',
    studentId: 'STU-049',
    studentName: 'Keshav Poddar',
    batchId: 'BAT-104',
    batchName: 'NEET UG Droppers - Intensive Batch',
    amount: 4500,
    paymentMethod: 'Cash',
    paymentDate: '2026-11-02',
    collectedBy: 'Er. Rakesh Sharma',
    remarks: 'NEET test series & revision module fee',
    invoicedAmount: 18000,
    paidAmountPrior: 13500,
    balanceRemaining: 0,
  },
  {
    id: 'TXN-2026-086',
    instituteId: 'INST-MTH-01',
    receiptNumber: 'RCP-2026-086',
    studentId: 'STU-008',
    studentName: 'Isha Choudhary',
    batchId: 'BAT-101',
    batchName: 'Class 10th CBSE - Maths & Science',
    amount: 3000,
    paymentMethod: 'UPI',
    paymentDate: '2026-11-03',
    collectedBy: 'Pooja Verma (Reception)',
    remarks: 'Class 10th Science module fee',
    invoicedAmount: 10000,
    paidAmountPrior: 7000,
    balanceRemaining: 0,
  },
  {
    id: 'TXN-2026-087',
    instituteId: 'INST-MTH-01',
    receiptNumber: 'RCP-2026-087',
    studentId: 'STU-005',
    studentName: 'Aditya Verma',
    batchId: 'BAT-101',
    batchName: 'Class 10th CBSE - Maths & Science',
    amount: 6000,
    paymentMethod: 'UPI',
    paymentDate: '2026-11-03',
    collectedBy: 'Pooja Verma (Reception)',
    remarks: 'Quarterly Advance Payment (Ref #98214)',
    invoicedAmount: 10000,
    paidAmountPrior: 4000,
    balanceRemaining: 0,
  },
  {
    id: 'TXN-2026-088',
    instituteId: 'INST-MTH-01',
    receiptNumber: 'RCP-2026-088',
    studentId: 'STU-076',
    studentName: 'Akshat Garg',
    batchId: 'BAT-106',
    batchName: 'Class 12th Commerce & Accountancy',
    amount: 3500,
    paymentMethod: 'Cash',
    paymentDate: '2026-11-03',
    collectedBy: 'Er. Rakesh Sharma',
    remarks: 'Commerce + Accounts term fee instalment',
    invoicedAmount: 8800,
    paidAmountPrior: 5300,
    balanceRemaining: 0,
  },
];

// Initial institute expenses for Mathura premier institute (rent, electricity, salaries, marketing, etc.)
export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'EXP-2026-001',
    instituteId: 'INST-MTH-01',
    category: 'rent',
    amount: 22000,
    expenseDate: '2026-11-01',
    title: 'Krishna Commercial Complex 2nd Floor Monthly Lease',
    recipient: 'Shri Radhey Real Estate Holdings',
    paymentMode: 'bank_transfer',
    referenceNumber: 'NEFT-SBIN2026110192',
    notes: 'Covering 1800 sq ft coaching floor area for November 2026.',
    isVoided: false,
    createdAt: '2026-11-01T10:00:00Z',
    updatedAt: '2026-11-01T10:00:00Z',
  },
  {
    id: 'EXP-2026-002',
    instituteId: 'INST-MTH-01',
    category: 'utilities',
    amount: 4800,
    expenseDate: '2026-11-02',
    title: 'UPPCL Electricity Bill - Classroom AC & Inverter',
    recipient: 'Uttar Pradesh Power Corporation Limited',
    paymentMode: 'upi',
    referenceNumber: 'UPI-UPPCL-8921829',
    notes: 'Electricity bill for October consumption.',
    isVoided: false,
    createdAt: '2026-11-02T11:30:00Z',
    updatedAt: '2026-11-02T11:30:00Z',
  },
  {
    id: 'EXP-2026-003',
    instituteId: 'INST-MTH-01',
    category: 'stationery',
    amount: 3200,
    expenseDate: '2026-11-03',
    title: 'Class 10th & JEE Foundation Practice Test Papers Printing',
    recipient: 'Brijwasi Graphics & Offset Printers',
    paymentMode: 'cash',
    referenceNumber: 'BILL-BG-4421',
    notes: '200 booklets of DPPs and weekly mock exam answer sheets.',
    isVoided: false,
    createdAt: '2026-11-03T15:00:00Z',
    updatedAt: '2026-11-03T15:00:00Z',
  },
];

// Initial batch weekly schedules with room allocations
export const INITIAL_BATCH_SCHEDULES: BatchSchedule[] = [
  {
    id: 'SCH-101-MON',
    instituteId: 'INST-MTH-01',
    batchId: 'BAT-101',
    dayOfWeek: 1, // Monday
    startTime: '16:30:00',
    endTime: '18:00:00',
    roomNumber: 'Room 101',
    isActive: true,
  },
  {
    id: 'SCH-101-WED',
    instituteId: 'INST-MTH-01',
    batchId: 'BAT-101',
    dayOfWeek: 3, // Wednesday
    startTime: '16:30:00',
    endTime: '18:00:00',
    roomNumber: 'Room 101',
    isActive: true,
  },
  {
    id: 'SCH-101-FRI',
    instituteId: 'INST-MTH-01',
    batchId: 'BAT-101',
    dayOfWeek: 5, // Friday
    startTime: '16:30:00',
    endTime: '18:00:00',
    roomNumber: 'Room 101',
    isActive: true,
  },
  {
    id: 'SCH-102-TUE',
    instituteId: 'INST-MTH-01',
    batchId: 'BAT-102',
    dayOfWeek: 2, // Tuesday
    startTime: '17:00:00',
    endTime: '19:00:00',
    roomNumber: 'Room 102',
    isActive: true,
  },
  {
    id: 'SCH-102-THU',
    instituteId: 'INST-MTH-01',
    batchId: 'BAT-102',
    dayOfWeek: 4, // Thursday
    startTime: '17:00:00',
    endTime: '19:00:00',
    roomNumber: 'Room 102',
    isActive: true,
  },
  {
    id: 'SCH-102-SAT',
    instituteId: 'INST-MTH-01',
    batchId: 'BAT-102',
    dayOfWeek: 6, // Saturday
    startTime: '17:00:00',
    endTime: '19:00:00',
    roomNumber: 'Room 102',
    isActive: true,
  },
];

// Initial historical student batch transfers
export const INITIAL_BATCH_TRANSFERS: StudentBatchTransfer[] = [
  {
    id: 'XFR-2026-001',
    instituteId: 'INST-MTH-01',
    studentId: 'STU-017',
    studentName: 'Aryan Mathur',
    fromBatchId: 'BAT-101',
    fromBatchName: 'Class 10th CBSE - Maths & Science',
    toBatchId: 'BAT-102',
    toBatchName: 'Class 11th - JEE Foundation Physics',
    transferDate: '2026-07-01',
    reason: 'Promoted to Class 11th JEE Foundation after 10th CBSE board results.',
    createdAt: '2026-07-01T09:00:00Z',
  },
];

// ==============================================================================
// Phase 15: FIXIA Super Admin Initial Platform Datasets
// ==============================================================================

export const INITIAL_PLATFORM_INSTITUTES: PlatformInstituteRecord[] = [
  {
    id: 'INST-MTH-01',
    name: 'Radha Krishna Academy',
    tagline: 'Mathura’s Premier Science & Board Exam Coaching',
    category: 'academic_k12',
    categoryLabel: 'School Academic & Foundation (Class 9–12)',
    city: 'Mathura',
    state: 'Uttar Pradesh',
    phone: '+91 98371 42890',
    email: 'director@radhakrishnaacademy.org',
    directorName: 'Er. Rakesh Sharma (M.Tech, Ex-FIITJEE)',
    regNumber: 'UP-MTH-COACH-2022-849',
    academicSession: '2026-2027',
    status: 'active',
    createdAt: '2024-04-10T10:00:00Z',
    studentCount: 84,
    batchCount: 6,
    facultyCount: 5,
    subscription: {
      ...INITIAL_COMMERCIAL_SUBSCRIPTION,
      instituteId: 'INST-MTH-01',
    },
  },
  {
    id: 'INST-VRN-02',
    name: 'Vrindavan Vidyapeeth',
    tagline: 'Excellence in Mathematics & Olympiad Training',
    category: 'academic_k12',
    categoryLabel: 'School Academic (Class 9-12 CBSE)',
    city: 'Vrindavan',
    state: 'Uttar Pradesh',
    phone: '+91 98375 66120',
    email: 'info@vrindavanvidyapeeth.org',
    directorName: 'Dr. Brijesh Goswami',
    regNumber: 'UP-VRN-COACH-2023-112',
    academicSession: '2026-2027',
    status: 'active',
    createdAt: '2024-08-15T12:00:00Z',
    studentCount: 42,
    batchCount: 3,
    facultyCount: 3,
    subscription: {
      id: 'COMM-SUB-02',
      instituteId: 'INST-VRN-02',
      modelType: 'saas_subscription',
      planName: 'Starter Plan (Up to 100 Students)',
      status: 'active',
      subscriptionStatus: 'active',
      licenceStatus: 'not_applicable',
      studentLimit: 100,
      enabledModules: ['students', 'batches', 'attendance', 'fees', 'reports'],
      setupFeePaid: 2999,
      billingCycle: 'monthly',
      recurringAmount: 999,
      renewalDate: '2027-02-15',
      hostingResponsibility: 'FIXIA Cloud (AWS Mumbai)',
      supportEntitlement: 'Standard Email & Ticket Support (24-48h turnaround)',
      maintenanceResponsibility: 'FIXIA Cloud Core Security Updates',
      upgradeEntitlement: 'Continuous standard updates',
      sourceCodeOwnership: false,
    },
  },
  {
    id: 'INST-AGR-03',
    name: 'Taj City IIT-JEE Forum',
    tagline: 'Elite Competitive Entrance Training Institute',
    category: 'engineering_medical',
    categoryLabel: 'Engineering & Medical Entrance (JEE / NEET)',
    city: 'Agra',
    state: 'Uttar Pradesh',
    phone: '+91 94122 88410',
    email: 'admissions@tajcityjee.com',
    directorName: 'Prof. Alok Saxena',
    regNumber: 'UP-AGR-COACH-2025-401',
    academicSession: '2026-2027',
    status: 'trial',
    createdAt: '2026-10-25T09:30:00Z',
    studentCount: 18,
    batchCount: 2,
    facultyCount: 2,
    subscription: {
      id: 'COMM-SUB-03',
      instituteId: 'INST-AGR-03',
      modelType: 'saas_subscription',
      planName: '14-Day Full Feature Free Trial',
      status: 'trial',
      subscriptionStatus: 'trial',
      licenceStatus: 'not_applicable',
      studentLimit: 50,
      enabledModules: ['students', 'batches', 'attendance', 'fees', 'expenses', 'timetable', 'reports'],
      setupFeePaid: 0,
      billingCycle: 'monthly',
      recurringAmount: 1999,
      renewalDate: '2026-11-15',
      hostingResponsibility: 'FIXIA Cloud Managed Trial',
      supportEntitlement: 'Onboarding specialist guidance via WhatsApp',
      maintenanceResponsibility: 'FIXIA Cloud Ops',
      upgradeEntitlement: 'Full feature evaluation access',
      sourceCodeOwnership: false,
    },
  },
  {
    id: 'INST-LKO-04',
    name: 'Gomti Nagar Civil Services Academy',
    tagline: 'Premier UPSC & State PCS Foundation Center',
    category: 'commerce_professional',
    categoryLabel: 'Government & Professional Exam Prep',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    phone: '+91 99180 55219',
    email: 'contact@gomtinagariastest.org',
    directorName: 'Col. Rajiv Mathur (Retd.)',
    regNumber: 'UP-LKO-COACH-2021-089',
    academicSession: '2026-2027',
    status: 'active',
    createdAt: '2023-11-01T11:00:00Z',
    studentCount: 210,
    batchCount: 8,
    facultyCount: 7,
    subscription: {
      id: 'COMM-SUB-04',
      instituteId: 'INST-LKO-04',
      modelType: 'one_time_licence',
      planName: 'One-Time Perpetual Software License (v2.4)',
      status: 'active',
      subscriptionStatus: 'not_applicable',
      licenceStatus: 'active',
      studentLimit: 500,
      enabledModules: ['students', 'batches', 'attendance', 'fees', 'expenses', 'timetable', 'reports', 'staff', 'offline_mode'],
      licenceKey: 'FIXIA-LIC-9842-8812-7741',
      licensedVersion: 'v2.4.0-LTS',
      licencePurchaseFee: 49999,
      licenceStartDate: '2023-11-01',
      hostingResponsibility: 'Dedicated Customer Private Cloud / On-Premise',
      supportEntitlement: 'Annual AMC & Level 3 Engineering Support',
      maintenanceResponsibility: 'Client IT Staff with FIXIA Annual Maintenance Contract',
      upgradeEntitlement: 'LTS Version Patches for 3 Years (Until Nov 2026)',
      sourceCodeOwnership: false,
    },
  },
  {
    id: 'INST-BLY-05',
    name: 'Bareilly Commerce Hub & CA Foundation',
    tagline: 'Comprehensive CA-Foundation & CS Tutoring',
    category: 'commerce_professional',
    categoryLabel: 'Commerce & Accounting',
    city: 'Bareilly',
    state: 'Uttar Pradesh',
    phone: '+91 97190 22104',
    email: 'admin@bareillycommerce.in',
    directorName: 'CA Naveen Khandelwal',
    regNumber: 'UP-BLY-COACH-2022-311',
    academicSession: '2026-2027',
    status: 'suspended',
    suspensionReason: 'SaaS monthly renewal past due >45 days. Account temporarily suspended pending invoice payment.',
    createdAt: '2024-01-20T10:00:00Z',
    studentCount: 35,
    batchCount: 2,
    facultyCount: 2,
    subscription: {
      id: 'COMM-SUB-05',
      instituteId: 'INST-BLY-05',
      modelType: 'saas_subscription',
      planName: 'Growth Plan (Up to 100 Students)',
      status: 'past_due',
      subscriptionStatus: 'past_due',
      licenceStatus: 'not_applicable',
      studentLimit: 100,
      enabledModules: ['students', 'batches', 'attendance', 'fees'],
      setupFeePaid: 4999,
      billingCycle: 'monthly',
      recurringAmount: 1499,
      renewalDate: '2026-09-20',
      hostingResponsibility: 'FIXIA Cloud (Suspended Access)',
      supportEntitlement: 'Suspended pending billing resolution',
      maintenanceResponsibility: 'Suspended',
      upgradeEntitlement: 'Suspended',
      sourceCodeOwnership: false,
    },
  },
];

export const INITIAL_SOFTWARE_LICENSES: SoftwareLicenseRecord[] = [
  {
    id: 'LIC-2026-001',
    licenseKey: 'FIXIA-LIC-9842-8812-7741',
    instituteId: 'INST-LKO-04',
    instituteName: 'Gomti Nagar Civil Services Academy',
    modelType: 'one_time_licence',
    licensedVersion: 'v2.4.0-LTS',
    status: 'active',
    licenseStartDate: '2023-11-01',
    maxStudents: 500,
    hardwareFingerprint: 'SRV-LKO-DELL-POWEREDGE-R450-4821',
    offlineChecksum: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b',
    maintenanceValidUntil: '2026-11-01',
    sourceCodeOwnership: false,
    createdAt: '2023-11-01T11:00:00Z',
    issuedBy: 'superadmin@fixia.in',
  },
  {
    id: 'LIC-2026-002',
    licenseKey: 'FIXIA-LIC-4421-1903-8822',
    instituteId: 'INST-DLH-99',
    instituteName: 'North Delhi Science Campus',
    modelType: 'one_time_licence',
    licensedVersion: 'v2.2.0',
    status: 'suspended',
    licenseStartDate: '2022-09-15',
    licenseExpiryDate: '2025-09-15',
    maxStudents: 300,
    hardwareFingerprint: 'SRV-DLH-HP-PROLIANT-DL380-9921',
    offlineChecksum: '3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d',
    maintenanceValidUntil: '2025-09-15',
    sourceCodeOwnership: false,
    createdAt: '2022-09-15T09:00:00Z',
    issuedBy: 'superadmin@fixia.in',
  },
];

export const INITIAL_PLATFORM_AUDIT_LOGS: PlatformAuditLog[] = [
  {
    id: 'PAUD-001',
    action: 'UPDATE_QUOTA',
    targetInstituteId: 'INST-MTH-01',
    targetInstituteName: 'Radha Krishna Academy',
    actorEmail: 'superadmin@fixia.in',
    actorId: 'USR-SUPERADMIN-01',
    details: {
      field: 'studentLimit',
      previousValue: 80,
      newValue: 100,
      plan: 'Growth Plan',
    },
    reason: 'Institute admitted 4 new batches; approved student quota expansion to 100 students.',
    timestamp: '2026-11-01T14:20:00Z',
  },
  {
    id: 'PAUD-002',
    action: 'SUSPEND_INSTITUTE',
    targetInstituteId: 'INST-BLY-05',
    targetInstituteName: 'Bareilly Commerce Hub & CA Foundation',
    actorEmail: 'superadmin@fixia.in',
    actorId: 'USR-SUPERADMIN-01',
    details: {
      previousStatus: 'active',
      newStatus: 'suspended',
      overdueDays: 45,
    },
    reason: 'Automatic and manual dunning notices ignored; suspended account after 45 days past due.',
    timestamp: '2026-11-05T10:15:00Z',
  },
  {
    id: 'PAUD-003',
    action: 'ISSUE_LICENSE',
    targetInstituteId: 'INST-LKO-04',
    targetInstituteName: 'Gomti Nagar Civil Services Academy',
    actorEmail: 'superadmin@fixia.in',
    actorId: 'USR-SUPERADMIN-01',
    details: {
      licenseKey: 'FIXIA-LIC-9842-8812-7741',
      version: 'v2.4.0-LTS',
      capacity: 500,
      model: 'one_time_licence',
    },
    reason: 'Executed Model B perpetual commercial deployment agreement for Lucknow coaching center.',
    timestamp: '2023-11-01T11:00:00Z',
  },
];


