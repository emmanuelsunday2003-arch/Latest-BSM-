import React, { useState, useEffect } from "react";
import { UserProfile, Student, Result, Attendance, Assignment, Payment, Announcement, School } from "../types";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import ReportCard from "./ReportCard";
import { Sparkles, Calendar, FileText, Wallet, ClipboardList, Megaphone, UserCheck, Award } from "lucide-react";

interface StudentParentViewProps {
  user: UserProfile;
  school: School | null;
}

export default function StudentParentView({ user, school }: StudentParentViewProps) {
  const [student, setStudent] = useState<Student | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const [loading, setLoading] = useState(true);
  const [activeSegment, setActiveSegment] = useState("results");

  // AI Tutor states
  const [aiAdvice, setAiAdvice] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetchStudentProfile();
  }, [user.schoolId, user.uid, user.role]);

  const fetchStudentProfile = async () => {
    try {
      setLoading(true);
      const schoolId = user.schoolId;

      let targetStudentId = "";

      if (user.role === "student") {
        targetStudentId = user.uid;
        // Query current student Profile matching login UID
        const q = query(collection(db, "students"), where("studentId", "==", user.uid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setStudent(snap.docs[0].data() as Student);
        } else {
          // Setup fallback mock student profile
          setStudent({
            studentId: user.uid,
            name: user.name,
            dob: "2010-04-12",
            gender: "Female",
            classId: "primary-5",
            parentEmail: "parent1@demo.com",
            schoolId,
            createdAt: new Date().toISOString()
          });
          targetStudentId = user.uid;
        }
      } else if (user.role === "parent") {
        // Query linked children index parent records
        const parentsSnap = await getDocs(query(collection(db, "parents"), where("parentId", "==", user.uid)));
        let childId = "student-1"; // demo fallback child
        if (!parentsSnap.empty) {
          const parentObj = parentsSnap.docs[0].data();
          if (parentObj.linkedChildren && parentObj.linkedChildren.length > 0) {
            childId = parentObj.linkedChildren[0];
          }
        }
        targetStudentId = childId;

        const sSnap = await getDocs(query(collection(db, "students"), where("studentId", "==", childId)));
        if (!sSnap.empty) {
          setStudent(sSnap.docs[0].data() as Student);
        } else {
          setStudent({
            studentId: childId,
            name: "Zainab Haruna",
            dob: "2015-08-14",
            gender: "Female",
            classId: "primary-5",
            parentEmail: user.email,
            schoolId,
            createdAt: new Date().toISOString()
          });
        }
      }

      // Fetch related records matching studentId or schoolId!
      const resultsQuery = query(collection(db, "results"), where("studentId", "==", targetStudentId));
      const payQuery = query(collection(db, "payments"), where("studentId", "==", targetStudentId));
      const assignmentsQuery = query(collection(db, "assignments"), where("schoolId", "==", schoolId));
      const annQuery = query(collection(db, "announcements"), where("schoolId", "==", schoolId));
      const attQuery = query(collection(db, "attendance"), where("schoolId", "==", schoolId));

      const [resSnap, pSnap, assignSnap, annSnap, attSnap] = await Promise.all([
        getDocs(resultsQuery),
        getDocs(payQuery),
        getDocs(assignmentsQuery),
        getDocs(annQuery),
        getDocs(attQuery)
      ]);

      setResults(resSnap.docs.map(d => d.data() as Result));
      setPayments(pSnap.docs.map(d => d.data() as Payment));
      setAnnouncements(annSnap.docs.map(d => d.data() as Announcement));
      
      const allAtt = attSnap.docs.map(d => d.data() as Attendance);
      // Filter out only attendance records matching target student
      const studentClassAtt = allAtt.filter(att => 
        att.records.some(rec => rec.studentId === targetStudentId)
      );
      setAttendance(studentClassAtt);

      const studentClass = student?.classId || "primary-5";
      const allAssign = assignSnap.docs.map(d => d.data() as Assignment);
      setAssignments(allAssign.filter(a => a.classId === studentClass));

    } catch (error) {
      console.error("Student portal query failure:", error);
    } finally {
      setLoading(false);
    }
  };

  // AI Private Tutor recommendations
  const handleAITutorFeedback = async () => {
    if (!student || results.length === 0) {
      setAiAdvice("Please load academic grades before consulting the AI Tutor Advisor.");
      return;
    }

    try {
      setAiLoading(true);
      const payload = {
        studentName: student.name,
        grades: results.map(r => ({ subject: r.subjectName, totalScore: r.totalScore, grade: r.grade }))
      };

      const res = await fetch("/api/ai/analyze-performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setAiAdvice(data.analysis || "Tutor advice compile complete.");
    } catch (error) {
      console.error("AI Tutor advisory error:", error);
      setAiAdvice("Failed to invoke Personal AI Tutor. Please configure GEMINI_API_KEY inside the workspace environment.");
    } finally {
      setAiLoading(false);
    }
  };

  if (!student) {
    return <div className="p-6 text-center text-slate-400 italic">Finding linked student account profiles...</div>;
  }

  // Attendance metrics
  const totalPresenceDays = attendance.length;
  const presentDaysCount = attendance.filter(att => 
    att.records.some(rec => rec.studentId === student.studentId && rec.status === "present")
  ).length;

  const attendancePercent = totalPresenceDays > 0 
    ? ((presentDaysCount / totalPresenceDays) * 100).toFixed(1) 
    : "85.0";

  return (
    <div className="space-y-6 font-sans">
      {/* Tab Nav Header */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-1 pb-px overflow-x-auto">
        {[
          { id: "results", label: "My Grades & Reports" },
          { id: "attendance", label: "Daily Presence calendar" },
          { id: "homework", label: "Learning Assignments" },
          { id: "payments", label: "Invoicing & Receipts" },
          { id: "announcements", label: "Bulletin announcements" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSegment(tab.id)}
            className={`px-4 py-2.5 font-semibold text-xs rounded-t-xl transition whitespace-nowrap ${
              activeSegment === tab.id
                ? "bg-white dark:bg-slate-900 border-t border-x border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 font-bold -mb-px"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 italic text-xs">Pulling student ledger indexes...</div>
      ) : (
        <>
          {/* TAB 1: ACADEMIC PERFORMANCE REPORT CARD */}
          {activeSegment === "results" && (
            <div className="space-y-6">
              <ReportCard student={student} school={school} results={results} />

              {/* AI Personal Tutor advisory */}
              <div className="bg-gradient-to-tr from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 h-48 w-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="space-y-1 relative z-10">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-blue-400 font-mono block">AI Tutoring Copilot</span>
                  <h3 className="font-bold text-base text-white">Consult academic AI Assistant Coach</h3>
                  <p className="text-slate-400 text-xs">
                    Get customized tips, weaknesses diagnostics, and personalized study milestones based on the above report card grades.
                  </p>
                </div>

                <div className="pt-2 relative z-10">
                  <button
                    onClick={handleAITutorFeedback}
                    disabled={aiLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center space-x-2 shadow-lg shadow-blue-500/25 transition disabled:opacity-50"
                  >
                    <Sparkles className="h-4 w-4 animate-pulse" />
                    <span>{aiLoading ? "Analyzing progress cards..." : "Request Academic Tutoring tips"}</span>
                  </button>
                </div>

                {aiAdvice && (
                  <div className="p-5 bg-white/5 border border-white/10 rounded-2xl text-slate-200 whitespace-pre-wrap leading-relaxed text-xs font-sans mt-4 relative z-10 transition duration-150">
                    {aiAdvice}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ATTENDANCE TRACKER */}
          {activeSegment === "attendance" && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 uppercase mb-1">Student Presence Logs</h3>
                <p className="text-slate-400 text-xs">Observe recorded register states for this terminal session</p>
              </div>

              <div className="flex border-4 border-slate-900 dark:border-slate-700 p-4 rounded-xl max-w-sm text-center">
                <div className="w-1/2">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono block">Terminal session Presence</span>
                  <span className="text-2xl font-bold block text-blue-600 dark:text-blue-400 mt-1">{attendancePercent}%</span>
                </div>
                <div className="w-1/2 border-l border-slate-200 dark:border-slate-800">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono block">Classes Tracked</span>
                  <span className="text-2xl font-bold block dark:text-slate-200 mt-1">{totalPresenceDays} days</span>
                </div>
              </div>

              <div className="space-y-2">
                {attendance.map(att => {
                  const myRec = att.records.find(r => r.studentId === student.studentId);
                  return (
                    <div key={att.attendanceId} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{att.date}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Stream: {att.classId.toUpperCase()}</span>
                      </div>
                      <span className={`px-2.5 py-1 text-[10px] rounded-lg font-bold uppercase ${
                        myRec?.status === "present" ? "bg-emerald-50 text-emerald-700" :
                        myRec?.status === "absent" ? "bg-rose-50 text-rose-700" :
                        "bg-amber-50 text-amber-700"
                      }`}>
                        {myRec?.status || "present"}
                      </span>
                    </div>
                  );
                })}
                {attendance.length === 0 && <div className="text-center py-6 text-slate-450 italic text-xs">No attendance sheets registered yet.</div>}
              </div>
            </div>
          )}

          {/* TAB 3: LEARNING ASSIGNMENTS */}
          {activeSegment === "homework" && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 uppercase">Learning Assignments List</h3>
                <p className="text-slate-400 text-xs">Complete and submit these homework worksheets before the specified deadlines</p>
              </div>

              <div className="space-y-4 pt-2">
                {assignments.map(a => (
                  <div key={a.assignmentId} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 rounded-xl space-y-2 relative">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-850 dark:text-slate-100 uppercase">{a.subjectName} : {a.title}</span>
                      <span className="text-[10px] text-rose-500 font-bold block bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5 rounded-lg">Due: {a.dueDate}</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{a.description}</p>
                    <span className="text-[10px] text-slate-400 block font-mono">Posted: {a.createdAt.substring(0, 10)}</span>
                  </div>
                ))}
                {assignments.length === 0 && <div className="text-center py-6 text-slate-400 italic text-xs">No homework worksheets on file. Excellent!</div>}
              </div>
            </div>
          )}

          {/* TAB 4: INVOICING & RECEIPTS */}
          {activeSegment === "payments" && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 uppercase mb-1">Tuition Fees & Invoicing Transactions</h3>
                <p className="text-slate-400 text-xs">Track payments history and outstanding school bills</p>
              </div>

              <div className="space-y-4">
                {payments.map(p => (
                  <div key={p.paymentId} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="font-bold text-xs block text-slate-800 dark:text-white uppercase">{p.feeCategoryName}</span>
                      <span className="text-[10px] text-slate-400 block">Transaction Reference ID: <code className="text-[10px] text-blue-500 font-mono uppercase">{p.paymentId}</code> ({p.date})</span>
                    </div>

                    <div className="flex items-center space-x-6 text-xs text-right">
                      <div>
                        <span className="text-slate-400 block text-[9.5px]">Amount Settled</span>
                        <span className="font-bold text-emerald-600 font-mono">₦{p.amountPaid.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9.5px]">Outstanding Balance</span>
                        <span className={`font-bold font-mono ${p.outstanding > 0 ? "text-rose-500" : "text-slate-400"}`}>
                          ₦{p.outstanding.toLocaleString()}
                        </span>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === "paid" ? "bg-emerald-50 text-emerald-700" :
                        p.status === "partial" ? "bg-amber-50 text-amber-700" :
                        "bg-rose-50 text-rose-700"
                      }`}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))}
                {payments.length === 0 && <div className="text-center py-6 text-slate-400 italic text-xs">No active fee receipts registered.</div>}
              </div>
            </div>
          )}

          {/* TAB 5: BULLETIN BOARD ANNOUNCEMENTS */}
          {activeSegment === "announcements" && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 uppercase">School Bulletin Notice Board</h3>
                <p className="text-slate-400 text-xs">Updates and announcements published by the Principal's Administration</p>
              </div>

              <div className="space-y-4 pt-2">
                {announcements.map(ann => (
                  <div key={ann.announcementId} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 rounded-xl space-y-1">
                    <span className="font-bold block text-xs text-slate-900 dark:text-white">{ann.title}</span>
                    <p className="text-xs text-slate-500 leading-relaxed">{ann.message}</p>
                    <span className="text-[10px] text-slate-400 block font-mono pt-1">Dated: {ann.createdAt.substring(0, 10)}</span>
                  </div>
                ))}
                {announcements.length === 0 && <div className="text-center py-6 text-slate-400 italic text-xs">No daily announcements broadcasted matching student class levels.</div>}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
