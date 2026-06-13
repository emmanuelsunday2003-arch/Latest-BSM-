import React, { useState, useEffect } from "react";
import { UserProfile, School, Student, Teacher, Parent, Class, Result, Attendance, Fee, Payment, Expense, Salary, Announcement } from "../types";
import { collection, addDoc, getDocs, query, where, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { 
  Building2, Plus, Sparkles, TrendingUp, Users, Award, 
  Wallet, Calendar, Megaphone, Trash2, GraduationCap, Check, 
  HelpCircle, CreditCard, ChevronRight, BarChart3, LineChart, PieChart 
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart as ReLineChart, Line, PieChart as RePieChart, Pie, Cell 
} from "recharts";

interface SchoolAdminViewProps {
  user: UserProfile;
  school: School | null;
  activeSubTab: string;
}

export default function SchoolAdminView({ user, school, activeSubTab }: SchoolAdminViewProps) {
  // DB Collections States
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [activeSegment, setActiveSegment] = useState(activeSubTab || "overview");

  // AI Insights states
  const [aiInsights, setAiInsights] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Forms states
  const [studentForm, setStudentForm] = useState({ name: "", dob: "", gender: "Male", classId: "primary-5", parentEmail: "", address: "", emergencyContact: "" });
  const [teacherForm, setTeacherForm] = useState({ name: "", qualification: "", phone: "", email: "", assignedClasses: "", assignedSubjects: "" });
  const [classForm, setClassForm] = useState({ classId: "", name: "", teacherId: "" });
  const [feeForm, setFeeForm] = useState({ categoryName: "", amount: 0, classId: "" });
  const [expenseForm, setExpenseForm] = useState({ category: "", description: "", amount: 0, date: "" });
  const [salaryForm, setSalaryForm] = useState({ staffId: "", staffName: "", role: "Teacher", amount: 0, status: "paid" as any, date: "" });
  const [announcementForm, setAnnouncementForm] = useState({ title: "", message: "", targetRole: "all" as any });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, [user.schoolId, activeSegment]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const schoolId = user.schoolId;

      // Parallel queries to isolate data securely by schoolId!
      const studentsQuery = query(collection(db, "students"), where("schoolId", "==", schoolId));
      const teachersQuery = query(collection(db, "teachers"), where("schoolId", "==", schoolId));
      const classesQuery = query(collection(db, "classes"), where("schoolId", "==", schoolId));
      const parentsQuery = query(collection(db, "parents"), where("schoolId", "==", schoolId));
      const resultsQuery = query(collection(db, "results"), where("schoolId", "==", schoolId));
      const attendanceQuery = query(collection(db, "attendance"), where("schoolId", "==", schoolId));
      const feesQuery = query(collection(db, "fees"), where("schoolId", "==", schoolId));
      const paymentsQuery = query(collection(db, "payments"), where("schoolId", "==", schoolId));
      const expensesQuery = query(collection(db, "expenses"), where("schoolId", "==", schoolId));
      const salariesQuery = query(collection(db, "salaries"), where("schoolId", "==", schoolId));
      const announcementsQuery = query(collection(db, "announcements"), where("schoolId", "==", schoolId));

      const [stSnap, teachSnap, clSnap, pSnap, resSnap, attSnap, feesSnap, paySnap, expSnap, salSnap, annSnap] = await Promise.all([
        getDocs(studentsQuery),
        getDocs(teachersQuery),
        getDocs(classesQuery),
        getDocs(parentsQuery),
        getDocs(resultsQuery),
        getDocs(attendanceQuery),
        getDocs(feesQuery),
        getDocs(paymentsQuery),
        getDocs(expensesQuery),
        getDocs(salariesQuery),
        getDocs(announcementsQuery)
      ]);

      setStudents(stSnap.docs.map(d => d.data() as Student));
      setTeachers(teachSnap.docs.map(d => d.data() as Teacher));
      setClasses(clSnap.docs.map(d => d.data() as Class));
      setParents(pSnap.docs.map(d => d.data() as Parent));
      setResults(resSnap.docs.map(d => d.data() as Result));
      setAttendance(attSnap.docs.map(d => d.data() as Attendance));
      setFees(feesSnap.docs.map(d => d.data() as Fee));
      setPayments(paySnap.docs.map(d => d.data() as Payment));
      setExpenses(expSnap.docs.map(d => d.data() as Expense));
      setSalaries(salSnap.docs.map(d => d.data() as Salary));
      setAnnouncements(annSnap.docs.map(d => d.data() as Announcement));

    } catch (error) {
      console.error("Error logging database indices for school:", error);
    } finally {
      setLoading(false);
    }
  };

  // AI Assistant trigger
  const handleAIInsights = async () => {
    try {
      setAiLoading(true);
      const payload = {
        stats: {
          totalStudents: students.length,
          totalTeachers: teachers.length,
          avgAcademicPerformance: results.length > 0 ? (results.reduce((acc, r) => acc + r.totalScore, 0) / results.length).toFixed(1) + "%" : "N/A",
          totalInvoicedTuitions: fees.length,
          totalCollectedTuitions: payments.reduce((acc, p) => acc + p.amountPaid, 0),
          totalExpenses: expenses.reduce((acc, e) => acc + e.amount, 0),
          expensesBreakdown: expenses.slice(0, 5).map(e => ({ cat: e.category, amt: e.amount }))
        }
      };

      const res = await fetch("/api/ai/school-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setAiInsights(data.insights || "No insight output received.");
    } catch (error) {
      console.error("AI insights generation error:", error);
      setAiInsights("Failed to fetch custom strategic data. Please verify your GEMINI_API_KEY.");
    } finally {
      setAiLoading(false);
    }
  };

  // Student CRUD adds
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const nextId = "student-" + Math.floor(Math.random() * 900 + 100);
      const studentObj: Student = {
        studentId: nextId,
        name: studentForm.name,
        dob: studentForm.dob,
        gender: studentForm.gender,
        classId: studentForm.classId,
        parentEmail: studentForm.parentEmail,
        address: studentForm.address,
        emergencyContact: studentForm.emergencyContact,
        schoolId: user.schoolId,
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, "students"), studentObj);
      
      // Setup associated mirroring user account
      await addDoc(collection(db, "users"), {
        uid: nextId,
        email: `${nextId}@demo.com`,
        name: studentForm.name,
        role: "student",
        schoolId: user.schoolId,
        createdAt: new Date().toISOString()
      });

      setStudentForm({ name: "", dob: "", gender: "Male", classId: "primary-5", parentEmail: "", address: "", emergencyContact: "" });
      fetchAllData();
    } catch (error) {
      console.error("Add Student failure:", error);
    } finally {
      setSaving(false);
    }
  };

  // Teacher CRUD adds
  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const nextId = "teacher-" + Math.floor(Math.random() * 900 + 100);
      const teacherObj: Teacher = {
        teacherId: nextId,
        name: teacherForm.name,
        qualification: teacherForm.qualification,
        phone: teacherForm.phone,
        email: teacherForm.email,
        assignedClasses: teacherForm.assignedClasses.split(",").map(c => c.trim()),
        assignedSubjects: teacherForm.assignedSubjects.split(",").map(s => s.trim()),
        schoolId: user.schoolId,
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, "teachers"), teacherObj);

      // Create credential mirroring
      await addDoc(collection(db, "users"), {
        uid: nextId,
        email: teacherForm.email,
        name: teacherForm.name,
        role: "teacher",
        schoolId: user.schoolId,
        createdAt: new Date().toISOString()
      });

      setTeacherForm({ name: "", qualification: "", phone: "", email: "", assignedClasses: "", assignedSubjects: "" });
      fetchAllData();
    } catch (error) {
      console.error("Add Teacher failure:", error);
    } finally {
      setSaving(false);
    }
  };

  // Class CRUD
  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload: Class = {
        classId: classForm.classId.toLowerCase().replace(/\s+/g, "-"),
        name: classForm.name,
        teacherId: classForm.teacherId || "unassigned",
        schoolId: user.schoolId,
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, "classes"), payload);
      setClassForm({ classId: "", name: "", teacherId: "" });
      fetchAllData();
    } catch (error) {
      console.error("Add Class failure:", error);
    } finally {
      setSaving(false);
    }
  };

  // Expense logging
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload: Expense = {
        expenseId: "exp-" + Math.floor(Math.random() * 90000 + 10000),
        category: expenseForm.category,
        description: expenseForm.description,
        amount: Number(expenseForm.amount),
        date: expenseForm.date || new Date().toISOString().split("T")[0],
        schoolId: user.schoolId,
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, "expenses"), payload);
      setExpenseForm({ category: "", description: "", amount: 0, date: "" });
      fetchAllData();
    } catch (error) {
      console.error("Error listing expenditure Outflows:", error);
    } finally {
      setSaving(false);
    }
  };

  // Salary mapping adds
  const handleAddSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload: Salary = {
        salaryId: "sal-" + Math.floor(Math.random() * 9000 + 1000),
        staffId: salaryForm.staffId,
        staffName: salaryForm.staffName,
        role: salaryForm.role,
        amount: Number(salaryForm.amount),
        status: salaryForm.status,
        date: salaryForm.date || new Date().toISOString().split("T")[0],
        schoolId: user.schoolId,
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, "salaries"), payload);
      setSalaryForm({ staffId: "", staffName: "", role: "Teacher", amount: 0, date: "", status: "paid" });
      fetchAllData();
    } catch (error) {
      console.error("Salary logging failed:", error);
    } finally {
      setSaving(false);
    }
  };

  // Announcement triggers
  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload: Announcement = {
        announcementId: "ann-" + Math.floor(Math.random() * 9000 + 1000),
        title: announcementForm.title,
        message: announcementForm.message,
        targetRole: announcementForm.targetRole,
        schoolId: user.schoolId,
        createdBy: user.uid,
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, "announcements"), payload);
      setAnnouncementForm({ title: "", message: "", targetRole: "all" });
      fetchAllData();
    } catch (error) {
      console.error("Announcement failed:", error);
    } finally {
      setSaving(false);
    }
  };

  // Delete records trigger
  const handleDeleteDoc = async (collName: string, idField: string, idVal: string) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      const snap = await getDocs(query(collection(db, collName), where(idField, "==", idVal)));
      if (!snap.empty) {
        await deleteDoc(doc(db, collName, snap.docs[0].id));
        fetchAllData();
      }
    } catch (error) {
      console.error(`Error deleting from ${collName}:`, error);
    }
  };

  // Math aggregates
  const totalFeesCollected = payments.reduce((acc, p) => acc + p.amountPaid, 0);
  const totalSpendings = expenses.reduce((acc, e) => acc + e.amount, 0);
  const totalSalaries = salaries.reduce((acc, s) => acc + s.amount, 0);
  const netEarnings = totalFeesCollected - totalSpendings - totalSalaries;

  // Grade allocations
  const scoreRates = results.length > 0 ? (results.reduce((acc, r) => acc + r.totalScore, 0) / results.length).toFixed(1) : "0.0";

  // Recharts payload converters
  const financeChartData = [
    { name: "Inflow (Fees)", amount: totalFeesCollected },
    { name: "Expenses", amount: totalSpendings },
    { name: "Salaries", amount: totalSalaries }
  ];

  const attendanceRatio = attendance.length > 0 
    ? ((attendance.reduce((acc, curr) => {
        const presents = curr.records.filter(r => r.status === "present").length;
        return acc + (presents / curr.records.length);
      }, 0) / attendance.length) * 100).toFixed(1)
    : "87.5";

  return (
    <div className="space-y-6 font-sans">
      {/* Sub tabs navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-1 overflow-x-auto pb-px">
        {[
          { id: "overview", label: "Overview Insights" },
          { id: "classes", label: "Classes" },
          { id: "teachers", label: "Teachers" },
          { id: "students", label: "Students" },
          { id: "finance", label: "Finance & Ledger" },
          { id: "announcements", label: "Announcements" },
          { id: "ai-copilot", label: "AI School Advisory" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSegment(tab.id)}
            className={`px-4 py-2.5 font-medium text-xs rounded-t-xl tracking-tight transition whitespace-nowrap ${
              activeSegment === tab.id
                ? "bg-white dark:bg-slate-900 border-t border-x border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 font-bold -mb-px"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            {tab.id === "ai-copilot" && <Sparkles className="h-3 w-3 inline mr-1 text-amber-500 animate-pulse" />}
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 italic text-xs">Awaiting tenant indices...</div>
      ) : (
        <>
          {/* TAB 1: OVERVIEW */}
          {activeSegment === "overview" && (
            <div className="space-y-6">
              {/* Statistical Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[10px] font-mono tracking-wider uppercase">Enrolled Students</span>
                    <Users className="h-4 w-4 text-blue-500" />
                  </div>
                  <span className="text-2xl font-bold dark:text-slate-100">{students.length}</span>
                  <p className="text-[9px] text-slate-400 mt-1">Multi-class breakdown active</p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[10px] font-mono tracking-wider uppercase">Faculty Staff</span>
                    <Users className="h-4 w-4 text-indigo-500" />
                  </div>
                  <span className="text-2xl font-bold dark:text-slate-100">{teachers.length}</span>
                  <p className="text-[9px] text-slate-400 mt-1">Academic department roster</p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[10px] font-mono tracking-wider uppercase">Average Score Index</span>
                    <Award className="h-4 w-4 text-emerald-500" />
                  </div>
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{scoreRates}%</span>
                  <p className="text-[9px] text-slate-400 mt-1">Continuous terminal assessments</p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[10px] font-mono tracking-wider uppercase">Net Finance Margin</span>
                    <Wallet className="h-4 w-4 text-amber-500" />
                  </div>
                  <span className={`text-2xl font-bold ${netEarnings >= 0 ? "text-slate-800 dark:text-slate-200" : "text-rose-600"}`}>
                    ₦{netEarnings.toLocaleString()}
                  </span>
                  <p className="text-[9px] text-slate-400 mt-1">Fees Collected - Expenses - Salaries</p>
                </div>
              </div>

              {/* Financial & Attendance Analytical Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Finance charts */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-4 flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                    <span>School Financial Ledger Distribution</span>
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={financeChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                        <YAxis stroke="#94a3b8" fontSize={11} />
                        <Tooltip />
                        <Bar dataKey="amount" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Information ledger & activities */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-4 flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-indigo-500" />
                      <span>Term Vital Statistics</span>
                    </h3>

                    <div className="space-y-4 text-xs font-sans">
                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 rounded-xl">
                        <span className="text-slate-500">Term Attendance Ratio</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{attendanceRatio}%</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 rounded-xl">
                        <span className="text-slate-500">Active High-School Classes</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{classes.length} Streams</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 rounded-xl">
                        <span className="text-slate-500">Outstanding Tuitions</span>
                        <span className="font-bold text-rose-500">₦{payments.reduce((acc, p) => acc + p.outstanding, 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => setActiveSegment("ai-copilot")}
                      className="w-full h-10 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-bold text-xs rounded-xl flex items-center justify-center space-x-2 hover:bg-indigo-100 transition"
                    >
                      <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                      <span>Request Strategic AI Assessment</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: CLASSES */}
          {activeSegment === "classes" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-4">Classrooms registry</h3>
                
                <div className="space-y-3">
                  {classes.map(c => (
                    <div key={c.classId} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase">{c.name}</span>
                        <code className="text-[10px] text-blue-500 block uppercase font-mono mt-0.5">{c.classId}</code>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-xs text-slate-400">Class Instructor: <span className="font-semibold text-slate-600 dark:text-slate-300">{c.teacherId}</span></span>
                        <button
                          onClick={() => handleDeleteDoc("classes", "classId", c.classId)}
                          className="p-1 px-2 text-[10px] text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/35 rounded-md"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-4">Provision New Class</h3>
                <form onSubmit={handleAddClass} className="space-y-4 text-xs">
                  <div>
                    <label className="text-slate-500 block mb-1">Class ID Path</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ss-3-science"
                      value={classForm.classId}
                      onChange={(e) => setClassForm({ ...classForm, classId: e.target.value })}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">Class Display Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SS 3 Science"
                      value={classForm.name}
                      onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">Class Instructor ID</label>
                    <input
                      type="text"
                      placeholder="e.g. teacher-1"
                      value={classForm.teacherId}
                      onChange={(e) => setClassForm({ ...classForm, teacherId: e.target.value })}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
                  >
                    Create Class Stream
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: TEACHERS */}
          {activeSegment === "teachers" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-4">Academic Instructors</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-400 font-semibold uppercase tracking-wider text-[9px] border-b border-slate-150 dark:border-slate-800">
                        <th className="p-3">Instructor</th>
                        <th className="p-3">Qualifications</th>
                        <th className="p-3">Subjects/Classes</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {teachers.map(t => (
                        <tr key={t.teacherId}>
                          <td className="p-3">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">{t.name}</span>
                            <code className="text-[10px] text-blue-500 block font-mono mt-0.5">{t.email}</code>
                          </td>
                          <td className="p-3 text-slate-500">{t.qualification}</td>
                          <td className="p-3">
                            <span className="text-[11px] block text-slate-600 dark:text-slate-300">Class: {t.assignedClasses.join(", ")}</span>
                            <span className="text-[10px] block text-slate-400 mt-0.5">Subject: {t.assignedSubjects.join(", ")}</span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleDeleteDoc("teachers", "teacherId", t.teacherId)}
                              className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/25 p-1 rounded"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-4">Enlist Faculty Teacher</h3>
                <form onSubmit={handleAddTeacher} className="space-y-4 text-xs">
                  <div>
                    <label className="text-slate-500 block mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Mrs. Jennifer Obi"
                      value={teacherForm.name}
                      onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">Qualifications</label>
                    <input
                      type="text"
                      required
                      placeholder="B.Sc. chemistry, PGDE"
                      value={teacherForm.qualification}
                      onChange={(e) => setTeacherForm({ ...teacherForm, qualification: e.target.value })}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">Login Email Address</label>
                    <input
                      type="email"
                      required
                      value={teacherForm.email}
                      onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">Phone Line</label>
                    <input
                      type="text"
                      value={teacherForm.phone}
                      onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-3">Classes Assigned (comma separated)</label>
                    <input
                      type="text"
                      required
                      placeholder="primary-5, ss-3"
                      value={teacherForm.assignedClasses}
                      onChange={(e) => setTeacherForm({ ...teacherForm, assignedClasses: e.target.value })}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">Subjects (comma separated)</label>
                    <input
                      type="text"
                      required
                      placeholder="Mathematics, Chemistry"
                      value={teacherForm.assignedSubjects}
                      onChange={(e) => setTeacherForm({ ...teacherForm, assignedSubjects: e.target.value })}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
                  >
                    Enlist Teacher
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 4: STUDENTS */}
          {activeSegment === "students" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-4 font-sans">Students registry</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-400 font-semibold uppercase tracking-wider text-[9px] border-b border-slate-150 dark:border-slate-800">
                        <th className="p-3">Student Info</th>
                        <th className="p-3">Class/DOB</th>
                        <th className="p-3">Parent Info</th>
                        <th className="p-3 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {students.map(s => (
                        <tr key={s.studentId}>
                          <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                            {s.name}
                            <code className="text-[10px] text-blue-500 block uppercase font-mono mt-0.5">{s.studentId}</code>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-slate-600 dark:text-slate-300 block uppercase">{s.classId}</span>
                            <span className="text-[10px] text-slate-400 mt-0.5">DOB: {s.dob}</span>
                          </td>
                          <td className="p-3">
                            <span className="text-slate-600 dark:text-slate-300 block">{s.parentEmail}</span>
                            <span className="text-[10px] text-slate-400 block">{s.emergencyContact}</span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleDeleteDoc("students", "studentId", s.studentId)}
                              className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/25 p-1 rounded"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-4">Admit New Student</h3>
                <form onSubmit={handleAddStudent} className="space-y-4 text-xs">
                  <div>
                    <label className="text-slate-500 block mb-1">Full Student Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Zainab Haruna"
                      value={studentForm.name}
                      onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">Date of Birth</label>
                    <input
                      type="date"
                      required
                      value={studentForm.dob}
                      onChange={(e) => setStudentForm({ ...studentForm, dob: e.target.value })}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">Class Stream Assigned</label>
                    <select
                      value={studentForm.classId}
                      onChange={(e) => setStudentForm({ ...studentForm, classId: e.target.value })}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl animate-fade"
                    >
                      {classes.map(c => (
                        <option key={c.classId} value={c.classId}>{c.name}</option>
                      ))}
                      {classes.length === 0 && <option value="primary-5">Primary 5 Blue</option>}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">Parent's Registered Email</label>
                    <input
                      type="email"
                      required
                      placeholder="parent@demo.com"
                      value={studentForm.parentEmail}
                      onChange={(e) => setStudentForm({ ...studentForm, parentEmail: e.target.value })}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">Emergency Contact Numbers</label>
                    <input
                      type="text"
                      placeholder="Father - 08012345"
                      value={studentForm.emergencyContact}
                      onChange={(e) => setStudentForm({ ...studentForm, emergencyContact: e.target.value })}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
                  >
                    Register Student Admissions
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 5: FINANCE & LEDGER */}
          {activeSegment === "finance" && (
            <div className="space-y-6">
              {/* Stat bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900 rounded-2xl p-5 shadow-sm text-emerald-800 dark:text-emerald-300">
                  <span className="text-[10px] font-mono uppercase tracking-wider block">Total Tuitions Collected</span>
                  <span className="text-2xl font-bold block mt-1">₦{totalFeesCollected.toLocaleString()}</span>
                </div>
                <div className="bg-rose-50 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-900 rounded-2xl p-5 shadow-sm text-rose-800 dark:text-rose-300">
                  <span className="text-[10px] font-mono uppercase tracking-wider block">Log Book Outflow (Expenses)</span>
                  <span className="text-2xl font-bold block mt-1">₦{totalSpendings.toLocaleString()}</span>
                </div>
                <div className="bg-blue-50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-900 rounded-2xl p-5 shadow-sm text-blue-800 dark:text-blue-300">
                  <span className="text-[10px] font-mono uppercase tracking-wider block">Staff Salaries Payroll</span>
                  <span className="text-2xl font-bold block mt-1">₦{totalSalaries.toLocaleString()}</span>
                </div>
              </div>

              {/* Expense registers form + listings list */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Exp registry */}
                <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-4">Operations Expense Logs</h4>
                  
                  <div className="space-y-3">
                    {expenses.map(e => (
                      <div key={e.expenseId} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div>
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">{e.category}</span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">{e.description} | {e.date}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="font-bold text-rose-600 font-mono text-xs">-₦{e.amount}</span>
                          <button
                            onClick={() => handleDeleteDoc("expenses", "expenseId", e.expenseId)}
                            className="p-1 px-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {expenses.length === 0 && <div className="text-center py-6 text-slate-400 italic text-xs">No recorded expenses logged this cycle.</div>}
                  </div>
                </div>

                {/* Exp form */}
                <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-4">Record Daily Expenses</h4>
                  <form onSubmit={handleAddExpense} className="space-y-4 text-xs">
                    <div>
                      <label className="text-slate-500 block mb-1">Expense Category</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Utility/Fueling"
                        value={expenseForm.category}
                        onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                        className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 block mb-1">Description Note</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 50L Generator Diesel"
                        value={expenseForm.description}
                        onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                        className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 block mb-1">Amount Paid (₦)</label>
                      <input
                        type="number"
                        required
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                        className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
                    >
                      Log Ledger Expense
                    </button>
                  </form>
                </div>

              </div>
            </div>
          )}

          {/* TAB 6: ANNOUNCEMENTS */}
          {activeSegment === "announcements" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-4">Institutional Bulletins Board</h3>
                
                <div className="space-y-4">
                  {announcements.map(ann => (
                    <div key={ann.announcementId} className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-150 dark:border-slate-805 space-y-2 relative">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-950 dark:text-slate-100">{ann.title}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 uppercase tracking-widest font-bold">Target: {ann.targetRole}</span>
                          <button
                            onClick={() => handleDeleteDoc("announcements", "announcementId", ann.announcementId)}
                            className="text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{ann.message}</p>
                      <span className="text-[10px] text-slate-400 block font-mono">Published: {ann.createdAt.substring(0, 10)}</span>
                    </div>
                  ))}
                  {announcements.length === 0 && <div className="text-center py-6 text-slate-400 italic text-xs">No announcements broadcasted yet.</div>}
                </div>
              </div>

              <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-4">Post Broadcast Bulletin</h3>
                <form onSubmit={handleAddAnnouncement} className="space-y-4 text-xs">
                  <div>
                    <label className="text-slate-500 block mb-1">Title Header</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. End of Term Sports"
                      value={announcementForm.title}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">Message Content</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Write your notice here..."
                      value={announcementForm.message}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">Target Audience</label>
                    <select
                      value={announcementForm.targetRole}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, targetRole: e.target.value })}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                    >
                      <option value="all">Everyone (All users)</option>
                      <option value="teacher">Academic Teachers Only</option>
                      <option value="student">Students Terminal Only</option>
                      <option value="parent">Parents Only</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
                  >
                    Broadcast Announcement
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* TAB 7: AI ADVISORY */}
          {activeSegment === "ai-copilot" && (
            <div className="bg-gradient-to-tr from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 h-64 w-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="space-y-2 relative z-10">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
                  <Sparkles className="h-5 w-5 text-amber-300 animate-pulse" />
                </div>
                <h3 className="font-bold text-lg text-white">Google Gemini Principal advisory Companion</h3>
                <p className="text-indigo-200/80 text-xs">
                  Generate administrative takeaways, financial health metrics, and overall student performance diagnostic remarks.
                </p>
              </div>

              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <p className="text-xs text-indigo-300">
                  Sends current stats (Total Students, Teachers ratio, tuitions margins, & expense ledgers) to compiles strategic takeaways.
                </p>
                <button
                  onClick={handleAIInsights}
                  disabled={aiLoading}
                  className="px-5 h-11 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/30 transition shrink-0 flex items-center justify-center space-x-2"
                >
                  {aiLoading ? "Consulting Advisor..." : "Generate Advisory Insights"}
                </button>
              </div>

              {aiInsights && (
                <div className="mt-6 p-5 bg-white/5 border border-white/10 rounded-2xl text-slate-200 leading-relaxed text-xs relative z-10 transition duration-150 whitespace-pre-wrap font-sans">
                  {aiInsights}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
