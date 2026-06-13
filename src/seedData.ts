import { doc, writeBatch, collection, getDocs, query, limit } from "firebase/firestore";
import { db } from "./firebase";
import { 
  School, 
  UserProfile, 
  Class, 
  Student, 
  Teacher, 
  Parent, 
  Result, 
  Attendance, 
  Assignment, 
  Fee, 
  Payment, 
  Expense, 
  Salary, 
  Announcement 
} from "./types";

export const SAMPLE_SCHOOLS: School[] = [
  {
    schoolId: "best-academy",
    name: "Best International Academy",
    motto: "Knowledge, Character, Excellence",
    address: "12 Education Lane, Lekki, Lagos",
    contactDetails: "info@bestacademy.edu | +234 801 234 5678",
    status: "active",
    subscriptionPlan: "Premier Annual",
    createdAt: new Date().toISOString()
  },
  {
    schoolId: "greenfield-school",
    name: "Greenfield High School",
    motto: "Nurturing Future Leaders",
    address: "7 Forest Avenue, Ikeja, Lagos",
    contactDetails: "contact@greenfieldhigh.edu",
    status: "active",
    subscriptionPlan: "Basic Monthly",
    createdAt: new Date().toISOString()
  }
];

export async function isDatabaseEmpty() {
  try {
    const q = query(collection(db, "schools"), limit(1));
    const snap = await getDocs(q);
    return snap.empty;
  } catch (error) {
    console.error("Error checking db empty state", error);
    return true;
  }
}

export async function seedDemoDataForSchool(schoolId: string, adminUid: string, adminEmail: string) {
  try {
    const batch = writeBatch(db);

    // 1. School Document
    const schoolRef = doc(db, "schools", schoolId);
    const schoolObj: School = {
      schoolId,
      name: schoolId === "best-academy" ? "Best International Academy" : "Greenfield High School",
      motto: schoolId === "best-academy" ? "Knowledge, Character, Excellence" : "Nurturing Future Leaders",
      address: "12 Education Lane, Lekki, Lagos",
      contactDetails: "info@bestschools.edu | +234 801 234 5678",
      status: "active",
      subscriptionPlan: "Premier Annual",
      createdAt: new Date().toISOString()
    };
    batch.set(schoolRef, schoolObj);

    // 2. Admin User
    const adminRef = doc(db, "users", adminUid);
    const adminProfile: UserProfile = {
      uid: adminUid,
      email: adminEmail,
      name: "Principal Administrator",
      role: "school-admin",
      schoolId,
      createdAt: new Date().toISOString()
    };
    batch.set(adminRef, adminProfile);

    // 3. Classes
    const classIds = ["primary-5", "jss-1", "ss-3"];
    const classNames = ["Primary 5 Blue", "JSS 1 Gold", "SS 3 Science"];
    
    classIds.forEach((cid, idx) => {
      const classRef = doc(db, "classes", cid);
      const classObj: Class = {
        classId: cid,
        name: classNames[idx],
        teacherId: `teacher-${idx + 1}`,
        schoolId,
        createdAt: new Date().toISOString()
      };
      batch.set(classRef, classObj);
    });

    // 4. Teachers
    const teachersList: Teacher[] = [
      {
        teacherId: "teacher-1",
        name: "Mrs. Sarah Jenkins",
        qualification: "B.Ed. in Mathematics & Educational Psych",
        phone: "+234 812 111 2233",
        email: "sarah.jenkins@bestschool.edu",
        assignedClasses: ["primary-5"],
        assignedSubjects: ["Mathematics", "Basic Science"],
        schoolId,
        createdAt: new Date().toISOString()
      },
      {
        teacherId: "teacher-2",
        name: "Mr. Chukwuma Obi",
        qualification: "M.Sc. in Chemistry, PGDE",
        phone: "+234 812 444 5566",
        email: "c.obi@bestschool.edu",
        assignedClasses: ["jss-1", "ss-3"],
        assignedSubjects: ["Chemistry", "Mathematics"],
        schoolId,
        createdAt: new Date().toISOString()
      }
    ];

    teachersList.forEach(t => {
      const ref = doc(db, "teachers", t.teacherId);
      batch.set(ref, t);
      // Create user auth mirror for teacher logins
      const uRef = doc(db, "users", t.teacherId);
      const uProfile: UserProfile = {
        uid: t.teacherId,
        email: t.email,
        name: t.name,
        role: "teacher",
        schoolId,
        createdAt: new Date().toISOString()
      };
      batch.set(uRef, uProfile);
    });

    // 5. Students
    const studentsList: Student[] = [
      {
        studentId: "student-1",
        name: "Zainab Haruna",
        dob: "2015-08-14",
        gender: "Female",
        classId: "primary-5",
        parentEmail: "parent1@demo.com",
        address: "Apartment 14, Highrise Estate, Lekki",
        emergencyContact: "Mr. Haruna (Father) - 0802 334 4556",
        schoolId,
        createdAt: new Date().toISOString()
      },
      {
        studentId: "student-2",
        name: "Daniel Adebayo",
        dob: "2010-02-19",
        gender: "Male",
        classId: "jss-1",
        parentEmail: "parent2@demo.com",
        address: "32 Victoria Boulevard, Lekki",
        emergencyContact: "Mrs. Adebayo (Mother) - 0803 112 2334",
        schoolId,
        createdAt: new Date().toISOString()
      },
      {
        studentId: "student-3",
        name: "Chinedu Okafor",
        dob: "2008-05-11",
        gender: "Male",
        classId: "ss-3",
        parentEmail: "parent3@demo.com",
        address: "5 Oceanview Terrace, Lekki",
        emergencyContact: "Dr. Okafor (Father) - 0805 777 8889",
        schoolId,
        createdAt: new Date().toISOString()
      }
    ];

    studentsList.forEach(s => {
      const sRef = doc(db, "students", s.studentId);
      batch.set(sRef, s);
      // Create user auth mirrors
      const uRef = doc(db, "users", s.studentId);
      batch.set(uRef, {
        uid: s.studentId,
        email: `${s.studentId}@bestschool.edu`,
        name: s.name,
        role: "student",
        schoolId,
        createdAt: new Date().toISOString()
      } as UserProfile);
    });

    // 6. Parents
    const parentsList: Parent[] = [
      {
        parentId: "parent-1",
        name: "Alhaji Haruna Yusuf",
        email: "parent1@demo.com",
        phone: "0802 334 4556",
        linkedChildren: ["student-1"],
        schoolId,
        createdAt: new Date().toISOString()
      },
      {
        parentId: "parent-2",
        name: "Mrs. Victoria Adebayo",
        email: "parent2@demo.com",
        phone: "0803 112 2334",
        linkedChildren: ["student-2"],
        schoolId,
        createdAt: new Date().toISOString()
      }
    ];

    parentsList.forEach(p => {
      const ref = doc(db, "parents", p.parentId);
      batch.set(ref, p);
      // Create user auth mirrors
      const uRef = doc(db, "users", p.parentId);
      batch.set(uRef, {
        uid: p.parentId,
        email: p.email,
        name: p.name,
        role: "parent",
        schoolId,
        createdAt: new Date().toISOString()
      } as UserProfile);
    });

    // 7. Results
    const resultsList: Result[] = [
      {
        resultId: "res-1",
        studentId: "student-1",
        studentName: "Zainab Haruna",
        classId: "primary-5",
        subjectName: "Mathematics",
        term: "Term 1",
        session: "2025/2026",
        caScore: 28,
        examScore: 56,
        totalScore: 84,
        grade: "A",
        remark: "Excellent work, very bright student.",
        schoolId,
        createdAt: new Date().toISOString()
      },
      {
        resultId: "res-2",
        studentId: "student-1",
        studentName: "Zainab Haruna",
        classId: "primary-5",
        subjectName: "Basic Science",
        term: "Term 1",
        session: "2025/2026",
        caScore: 25,
        examScore: 48,
        totalScore: 73,
        grade: "B",
        remark: "Good comprehension of scientific basics.",
        schoolId,
        createdAt: new Date().toISOString()
      },
      {
        resultId: "res-3",
        studentId: "student-3",
        studentName: "Chinedu Okafor",
        classId: "ss-3",
        subjectName: "Chemistry",
        term: "Term 1",
        session: "2025/2026",
        caScore: 18,
        examScore: 35,
        totalScore: 53,
        grade: "D",
        remark: "Weak chemical structural knowledge. Recommend extra tutorials.",
        schoolId,
        createdAt: new Date().toISOString()
      },
      {
        resultId: "res-4",
        studentId: "student-3",
        studentName: "Chinedu Okafor",
        classId: "ss-3",
        subjectName: "Mathematics",
        term: "Term 1",
        session: "2025/2026",
        caScore: 22,
        examScore: 44,
        totalScore: 66,
        grade: "C",
        remark: "Satisfactory, can improve with more worksheets.",
        schoolId,
        createdAt: new Date().toISOString()
      }
    ];

    resultsList.forEach(r => {
      const ref = doc(db, "results", r.resultId);
      batch.set(ref, r);
    });

    // 8. Finance Modules (Fees, Payments, Expenses, Salaries)
    const feesList: Fee[] = [
      {
        feeId: "fee-tuition-p5",
        categoryName: "Tuition Fee - Primary school",
        amount: 150000,
        classId: "primary-5",
        schoolId,
        createdAt: new Date().toISOString()
      },
      {
        feeId: "fee-tuition-ss",
        categoryName: "Tuition Fee - High School Senior",
        amount: 250000,
        classId: "ss-3",
        schoolId,
        createdAt: new Date().toISOString()
      }
    ];

    feesList.forEach(f => {
      const ref = doc(db, "fees", f.feeId);
      batch.set(ref, f);
    });

    const paymentsList: Payment[] = [
      {
        paymentId: "pay-1",
        studentId: "student-1",
        studentName: "Zainab Haruna",
        feeId: "fee-tuition-p5",
        feeCategoryName: "Tuition Fee - Primary school",
        amountPaid: 150000,
        outstanding: 0,
        date: "2026-05-10",
        status: "paid",
        schoolId,
        createdAt: new Date().toISOString()
      },
      {
        paymentId: "pay-2",
        studentId: "student-3",
        studentName: "Chinedu Okafor",
        feeId: "fee-tuition-ss",
        feeCategoryName: "Tuition Fee - High School Senior",
        amountPaid: 150000,
        outstanding: 100000,
        date: "2026-06-01",
        status: "partial",
        schoolId,
        createdAt: new Date().toISOString()
      }
    ];

    paymentsList.forEach(p => {
      const ref = doc(db, "payments", p.paymentId);
      batch.set(ref, p);
    });

    const expensesList: Expense[] = [
      {
        expenseId: "exp-1",
        category: "Laboratory Supplies",
        description: "Beakers and acids for chemistry lab SS3 exam prep",
        amount: 35000,
        date: "2026-06-02",
        schoolId,
        createdAt: new Date().toISOString()
      },
      {
        expenseId: "exp-2",
        category: "Generator Fuelling",
        description: "50 Liters of Diesel for school generator power backup",
        amount: 45000,
        date: "2026-06-10",
        schoolId,
        createdAt: new Date().toISOString()
      }
    ];

    expensesList.forEach(e => {
      const ref = doc(db, "expenses", e.expenseId);
      batch.set(ref, e);
    });

    const salariesList: Salary[] = [
      {
        salaryId: "sal-1",
        staffId: "teacher-1",
        staffName: "Sarah Jenkins",
        role: "Teacher",
        amount: 120000,
        status: "paid",
        date: "2026-05-28",
        schoolId,
        createdAt: new Date().toISOString()
      },
      {
        salaryId: "sal-2",
        staffId: "teacher-2",
        staffName: "Chukwuma Obi",
        role: "Teacher",
        amount: 140000,
        status: "paid",
        date: "2026-05-28",
        schoolId,
        createdAt: new Date().toISOString()
      }
    ];

    salariesList.forEach(s => {
      const ref = doc(db, "salaries", s.salaryId);
      batch.set(ref, s);
    });

    // 9. Assignments
    const assignmentsList: Assignment[] = [
      {
        assignmentId: "assign-1",
        classId: "primary-5",
        subjectName: "Basic Science",
        title: "Solar System Map Coloring",
        description: "Draw the major planets, color them and write 2 facts about Mars.",
        dueDate: "2026-06-18",
        schoolId,
        createdBy: "teacher-1",
        createdAt: new Date().toISOString()
      },
      {
        assignmentId: "assign-2",
        classId: "ss-3",
        subjectName: "Chemistry",
        title: "Organic Halides Reactions worksheet",
        description: "Solve problems 1-5 regarding substitution and elimination pathways.",
        dueDate: "2026-06-15",
        schoolId,
        createdBy: "teacher-2",
        createdAt: new Date().toISOString()
      }
    ];

    assignmentsList.forEach(a => {
      const ref = doc(db, "assignments", a.assignmentId);
      batch.set(ref, a);
    });

    // 10. Attendance Registers
    const attendanceRecords: Attendance[] = [
      {
        attendanceId: "att-1",
        classId: "primary-5",
        className: "Primary 5 Blue",
        date: "2026-06-11",
        records: [
          { studentId: "student-1", studentName: "Zainab Haruna", status: "present" }
        ],
        schoolId,
        markedBy: "teacher-1",
        createdAt: new Date().toISOString()
      },
      {
        attendanceId: "att-2",
        classId: "ss-3",
        className: "SS 3 Science",
        date: "2026-06-11",
        records: [
          { studentId: "student-3", studentName: "Chinedu Okafor", status: "absent" }
        ],
        schoolId,
        markedBy: "teacher-2",
        createdAt: new Date().toISOString()
      }
    ];

    attendanceRecords.forEach(att => {
      const ref = doc(db, "attendance", att.attendanceId);
      batch.set(ref, att);
    });

    // 11. Announcements
    const announcementsList: Announcement[] = [
      {
        announcementId: "ann-1",
        title: "Third Term Science Olympiad Trials",
        message: "School trials for the National Chemistry Olympiad will start next Friday. Interested SS1-SS3 chemistry students should register in the admin office.",
        targetRole: "all",
        schoolId,
        createdBy: adminUid,
        createdAt: new Date().toISOString()
      },
      {
        announcementId: "ann-2",
        title: "Inter-House Sports Registrations Open",
        message: "Sign ups are open for football, relay runs, and track events. Check in with your house masters.",
        targetRole: "student",
        schoolId,
        createdBy: adminUid,
        createdAt: new Date().toISOString()
      }
    ];

    announcementsList.forEach(ann => {
      const ref = doc(db, "announcements", ann.announcementId);
      batch.set(ref, ann);
    });

    await batch.commit();
    console.log("Seed data created successfully with school ID:", schoolId);
    return true;
  } catch (error) {
    console.error("Critical failure during batch database seeding:", error);
    throw error;
  }
}
