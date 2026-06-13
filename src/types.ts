export type UserRole = 'super-admin' | 'school-admin' | 'teacher' | 'student' | 'parent';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  schoolId: string;
  photoUrl?: string;
  createdAt?: string;
}

export interface School {
  schoolId: string;
  name: string;
  motto?: string;
  address?: string;
  contactDetails?: string;
  logoUrl?: string;
  status: 'active' | 'inactive';
  subscriptionPlan: string;
  createdAt: string;
}

export interface Student {
  studentId: string;
  name: string;
  dob: string;
  gender: string;
  classId: string;
  parentEmail: string;
  address?: string;
  medicalInfo?: string;
  emergencyContact?: string;
  photoUrl?: string;
  schoolId: string;
  createdAt: string;
}

export interface Teacher {
  teacherId: string;
  name: string;
  qualification: string;
  phone: string;
  email: string;
  assignedClasses: string[]; // array of class names/ids
  assignedSubjects: string[]; // array of subject names
  photoUrl?: string;
  schoolId: string;
  createdAt: string;
}

export interface Parent {
  parentId: string;
  name: string;
  email: string;
  phone: string;
  linkedChildren: string[]; // StudentIds
  schoolId: string;
  createdAt: string;
}

export interface Class {
  classId: string;
  name: string;
  teacherId?: string;
  schoolId: string;
  createdAt: string;
}

export interface Result {
  resultId: string;
  studentId: string;
  studentName: string;
  classId: string;
  subjectName: string;
  term: 'Term 1' | 'Term 2' | 'Term 3';
  session: string; // e.g., "2025/2026"
  caScore: number;
  examScore: number;
  totalScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  remark: string;
  schoolId: string;
  createdAt: string;
}

export interface AttendanceRecord {
  studentId: string;
  studentName: string;
  status: 'present' | 'absent' | 'late';
}

export interface Attendance {
  attendanceId: string;
  classId: string;
  className?: string;
  date: string; // YYYY-MM-DD
  records: AttendanceRecord[];
  schoolId: string;
  markedBy: string; // teacherId
  createdAt: string;
}

export interface Assignment {
  assignmentId: string;
  classId: string;
  subjectName: string;
  title: string;
  description: string;
  dueDate: string;
  schoolId: string;
  createdBy: string;
  createdAt: string;
}

export interface Fee {
  feeId: string;
  categoryName: string;
  amount: number;
  classId?: string; // all or specific class
  schoolId: string;
  createdAt: string;
}

export interface Payment {
  paymentId: string;
  studentId: string;
  studentName: string;
  feeId: string;
  feeCategoryName: string;
  amountPaid: number;
  outstanding: number;
  date: string;
  status: 'paid' | 'partial' | 'unpaid';
  schoolId: string;
  createdAt: string;
}

export interface Expense {
  expenseId: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  schoolId: string;
  createdAt: string;
}

export interface Salary {
  salaryId: string;
  staffId: string;
  staffName: string;
  role: string;
  amount: number;
  status: 'paid' | 'pending';
  date: string;
  schoolId: string;
  createdAt: string;
}

export interface Announcement {
  announcementId: string;
  title: string;
  message: string;
  targetRole: 'all' | UserRole;
  schoolId: string;
  createdBy: string;
  createdAt: string;
}
