import React, { useState, useEffect } from "react";
import { UserProfile, Student, Class, Result, Attendance, Assignment } from "../types";
import { collection, addDoc, getDocs, query, where, writeBatch, doc } from "firebase/firestore";
import { db } from "../firebase";
import { Sparkles, Calendar, FileText, ClipboardList, BookOpen, Clock, CheckCircle } from "lucide-react";

interface TeacherViewProps {
  user: UserProfile;
}

export default function TeacherView({ user }: TeacherViewProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeSegment, setActiveSegment] = useState("grades");

  // Interactive Grade entry states
  const [gradeClass, setGradeClass] = useState("primary-5");
  const [gradeSubject, setGradeSubject] = useState("Mathematics");
  const [caScores, setCaScores] = useState<Record<string, number>>({});
  const [examScores, setExamScores] = useState<Record<string, number>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [resultsSaving, setResultsSaving] = useState(false);

  // Attendance marking states
  const [attDate, setAttDate] = useState(new Date().toISOString().split("T")[0]);
  const [attStatus, setAttStatus] = useState<Record<string, "present" | "absent" | "late">>({});
  const [attSaving, setAttSaving] = useState(false);

  // Homework creation form
  const [assignForm, setAssignForm] = useState({ title: "", description: "", dueDate: "", subject: "Mathematics", classId: "primary-5" });
  const [assignSaving, setAssignSaving] = useState(false);

  // AI states
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchTeacherDossier();
  }, [user.schoolId]);

  const fetchTeacherDossier = async () => {
    try {
      setLoading(true);
      const schoolId = user.schoolId;

      // Pull isolated data securely by schoolId!
      const studentsSnap = await getDocs(query(collection(db, "students"), where("schoolId", "==", schoolId)));
      const classesSnap = await getDocs(query(collection(db, "classes"), where("schoolId", "==", schoolId)));
      const resultsSnap = await getDocs(query(collection(db, "results"), where("schoolId", "==", schoolId)));
      const assignmentsSnap = await getDocs(query(collection(db, "assignments"), where("schoolId", "==", schoolId)));

      const studentsList = studentsSnap.docs.map(d => d.data() as Student);
      setStudents(studentsList);
      setClasses(classesSnap.docs.map(d => d.data() as Class));
      setResults(resultsSnap.docs.map(d => d.data() as Result));
      setAssignments(assignmentsSnap.docs.map(d => d.data() as Assignment));

      // Prefill grade inputs from existing records
      const initialCa: Record<string, number> = {};
      const initialEx: Record<string, number> = {};
      const initialRem: Record<string, string> = {};
      const initialAtt: Record<string, "present" | "absent" | "late"> = {};

      resultsSnap.docs.forEach(d => {
        const r = d.data() as Result;
        if (r.classId === gradeClass && r.subjectName === gradeSubject) {
          initialCa[r.studentId] = r.caScore;
          initialEx[r.studentId] = r.examScore;
          initialRem[r.studentId] = r.remark;
        }
      });

      setCaScores(initialCa);
      setExamScores(initialEx);
      setRemarks(initialRem);

      studentsList.forEach(s => {
        initialAtt[s.studentId] = "present";
      });
      setAttStatus(initialAtt);

    } catch (error) {
      console.error("Error drawing teacher dossier:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper score grading map
  const getGradeAndRemark = (total: number) => {
    if (total >= 80) return { grade: "A" as const, remark: "Excellent Very Good" };
    if (total >= 70) return { grade: "B" as const, remark: "Very Good" };
    if (total >= 60) return { grade: "C" as const, remark: "Good" };
    if (total >= 50) return { grade: "D" as const, remark: "Needs Improvement" };
    return { grade: "F" as const, remark: "Poor" };
  };

  // AI remark comment generator
  const triggerAiCommentComment = async (studentId: string, studentName: string) => {
    const ca = caScores[studentId] || 0;
    const exam = examScores[studentId] || 0;
    const total = ca + exam;

    try {
      setAiLoading(prev => ({ ...prev, [studentId]: true }));
      const payload = {
        studentName,
        subjectName: gradeSubject,
        score: total,
        term: "First Term",
        commentsTone: "professional and encouraging"
      };

      const res = await fetch("/api/ai/report-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      const generatedRemarks = data.comment || "Satisfactory progress this term.";

      setRemarks(prev => ({ ...prev, [studentId]: generatedRemarks }));
    } catch (error) {
      console.error("AI remark comments generation failure:", error);
      setRemarks(prev => ({ ...prev, [studentId]: "Maintained consistent efforts throughout the subject term." }));
    } finally {
      setAiLoading(prev => ({ ...prev, [studentId]: false }));
    }
  };

  // Save Graded Results batch to Firestore
  const handleSaveGradesTable = async () => {
    try {
      setResultsSaving(true);
      const batch = writeBatch(db);
      const targetStudents = students.filter(s => s.classId === gradeClass);

      for (const s of targetStudents) {
        const ca = Number(caScores[s.studentId] || 0);
        const exam = Number(examScores[s.studentId] || 0);
        const total = ca + exam;
        const grading = getGradeAndRemark(total);
        const finalRemark = remarks[s.studentId] || grading.remark;

        const resultId = `res-${gradeClass}-${gradeSubject.toLowerCase()}-${s.studentId}`;
        const ref = doc(db, "results", resultId);

        const payload: Result = {
          resultId,
          studentId: s.studentId,
          studentName: s.name,
          classId: gradeClass,
          subjectName: gradeSubject,
          term: "Term 1",
          session: "2025/2026",
          caScore: ca,
          examScore: exam,
          totalScore: total,
          grade: grading.grade,
          remark: finalRemark,
          schoolId: user.schoolId,
          createdAt: new Date().toISOString()
        };

        batch.set(ref, payload);
      }

      await batch.commit();
      alert("Academic Grades ledger synchronized successfully!");
      fetchTeacherDossier();
    } catch (error) {
      console.error("Error writing results batch:", error);
    } finally {
      setResultsSaving(false);
    }
  };

  // Save Daily attendance trigger
  const handleRecordAttendance = async () => {
    try {
      setAttSaving(true);
      const records = students
        .filter(s => s.classId === gradeClass)
        .map(s => ({
          studentId: s.studentId,
          studentName: s.name,
          status: attStatus[s.studentId] || "present"
        }));

      const attendanceId = `att-${gradeClass}-${attDate}`;
      const payload: Attendance = {
        attendanceId,
        classId: gradeClass,
        date: attDate,
        records,
        schoolId: user.schoolId,
        markedBy: user.uid,
        createdAt: new Date().toISOString()
      };

      const ref = doc(db, "attendance", attendanceId);
      const batch = writeBatch(db);
      batch.set(ref, payload);
      await batch.commit();

      alert("Daily Attendance register submitted successfully!");
    } catch (error) {
      console.error("Attendance writing error:", error);
    } finally {
      setAttSaving(false);
    }
  };

  // Assignments upload
  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAssignSaving(true);
      const payload: Assignment = {
        assignmentId: "assign-" + Math.floor(Math.random() * 90000 + 10000),
        classId: assignForm.classId,
        subjectName: assignForm.subject,
        title: assignForm.title,
        description: assignForm.description,
        dueDate: assignForm.dueDate,
        schoolId: user.schoolId,
        createdBy: user.uid,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, "assignments"), payload);
      setAssignForm({ title: "", description: "", dueDate: "", subject: "Mathematics", classId: "primary-5" });
      fetchTeacherDossier();
      alert("Homework assignment added successfully.");
    } catch (error) {
      console.error("Assignment tracking failed:", error);
    } finally {
      setAssignSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Tab selection links */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-1 pb-px overflow-x-auto">
        {[
          { id: "grades", label: "CA & Exams ledger Grid" },
          { id: "attendance", label: "Daily Attendance registers" },
          { id: "homework", label: "Post Learning Assignments" }
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
        <div className="py-12 text-center text-slate-400 italic text-xs">Synchronizing classroom registry...</div>
      ) : (
        <>
          {/* SECTOR 1: CA & EXAMS GRADES LEDGER */}
          {activeSegment === "grades" && (
            <div className="space-y-6">
              
              {/* Filter controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Target Class</label>
                  <select
                    value={gradeClass}
                    onChange={(e) => setGradeClass(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
                  >
                    {classes.map(c => (
                      <option key={c.classId} value={c.classId}>{c.name}</option>
                    ))}
                    {classes.length === 0 && <option value="primary-5">Primary 5 Blue</option>}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Subject Scope</label>
                  <select
                    value={gradeSubject}
                    onChange={(e) => setGradeSubject(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Basic Science">Basic Science</option>
                    <option value="English Language">English Language</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={fetchTeacherDossier}
                    className="w-full h-10 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-705 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition-colors"
                  >
                    Load Grade inputs
                  </button>
                </div>
              </div>

              {/* Grading Entry table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4 select-none">
                  <div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 uppercase">Interactive Grading Registry</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Input continuous assessment metrics [CA max 30 | Exams max 70]</p>
                  </div>

                  <button
                    onClick={handleSaveGradesTable}
                    disabled={resultsSaving}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20"
                  >
                    {resultsSaving ? "Synchronizing..." : "Sync Grades Ledger"}
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                        <th className="p-3 font-semibold">Student Name / ID</th>
                        <th className="p-3 w-28 text-center font-semibold text-blue-500">CA (Max 30)</th>
                        <th className="p-3 w-28 text-center font-semibold text-indigo-500">Exam (Max 70)</th>
                        <th className="p-3 w-20 text-center font-semibold">Total</th>
                        <th className="p-3 w-20 text-center font-semibold">Grade</th>
                        <th className="p-3 font-semibold">Official Remarks [Report Comment]</th>
                        <th className="p-3 w-40 text-center font-semibold">Copilot assistant</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {students.filter(s => s.classId === gradeClass).map((s) => {
                        const ca = caScores[s.studentId] || 0;
                        const exam = examScores[s.studentId] || 0;
                        const total = ca + exam;
                        const grading = getGradeAndRemark(total);

                        return (
                          <tr key={s.studentId} className="hover:bg-slate-50/20 dark:hover:bg-slate-800/10">
                            <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                              {s.name}
                              <code className="text-[10px] text-slate-400 font-mono block uppercase mt-0.5">{s.studentId}</code>
                            </td>
                            <td className="p-3">
                              <input
                                type="number"
                                min={0}
                                max={30}
                                value={caScores[s.studentId] || ""}
                                onChange={(e) => setCaScores({ ...caScores, [s.studentId]: Number(e.target.value) })}
                                className="w-full h-9 text-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                              />
                            </td>
                            <td className="p-3">
                              <input
                                type="number"
                                min={0}
                                max={70}
                                value={examScores[s.studentId] || ""}
                                onChange={(e) => setExamScores({ ...examScores, [s.studentId]: Number(e.target.value) })}
                                className="w-full h-9 text-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                              />
                            </td>
                            <td className="p-3 text-center font-bold font-mono text-blue-600 dark:text-blue-400">{total}</td>
                            <td className="p-3 text-center">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                                grading.grade === 'A' ? 'bg-emerald-50 text-emerald-700' :
                                grading.grade === 'B' ? 'bg-teal-50 text-teal-700' :
                                grading.grade === 'C' ? 'bg-cyan-50 text-cyan-700' :
                                grading.grade === 'D' ? 'bg-amber-50 text-amber-505' :
                                'bg-rose-50 text-rose-700'
                              }`}>
                                {grading.grade}
                              </span>
                            </td>
                            <td className="p-3">
                              <input
                                type="text"
                                placeholder={grading.remark}
                                value={remarks[s.studentId] || ""}
                                onChange={(e) => setRemarks({ ...remarks, [s.studentId]: e.target.value })}
                                className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                              />
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => triggerAiCommentComment(s.studentId, s.name)}
                                disabled={aiLoading[s.studentId]}
                                className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded-xl transition text-[10px] font-bold flex items-center justify-center space-x-1 w-full"
                              >
                                <Sparkles className="h-3 w-3 animate-pulse" />
                                <span>{aiLoading[s.studentId] ? "Analyzing..." : "GenAI Remark"}</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {students.filter(s => s.classId === gradeClass).length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400 italic text-xs">
                            No students registered under the chosen class stream filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* SECTOR 2: ATTENDANCE CHANNELS */}
          {activeSegment === "attendance" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center justify-between border-b pb-4 mb-4 select-none">
                  <div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 uppercase">Mark Daily Attendance</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Check class attendance ledger registers</p>
                  </div>
                  
                  <button
                    onClick={handleRecordAttendance}
                    disabled={attSaving}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl"
                  >
                    {attSaving ? "Submitting register..." : "Submit Register Logs"}
                  </button>
                </div>

                <div className="space-y-2">
                  {students.filter(s => s.classId === gradeClass).map(s => (
                    <div key={s.studentId} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850 rounded-xl">
                      <div>
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{s.name}</span>
                        <code className="text-[10px] text-slate-400 font-mono block mt-0.5 uppercase">{s.studentId}</code>
                      </div>

                      <div className="flex items-center space-x-2 text-[10px] font-bold">
                        <button
                          onClick={() => setAttStatus({ ...attStatus, [s.studentId]: "present" })}
                          className={`px-3 py-1.5 rounded-lg border-2 ${
                            attStatus[s.studentId] === "present"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                              : "bg-white border-slate-250 text-slate-500"
                          }`}
                        >
                          Present
                        </button>
                        <button
                          onClick={() => setAttStatus({ ...attStatus, [s.studentId]: "absent" })}
                          className={`px-3 py-1.5 rounded-lg border-2 ${
                            attStatus[s.studentId] === "absent"
                              ? "bg-rose-50 text-rose-700 border-rose-300"
                              : "bg-white border-slate-250 text-slate-505"
                          }`}
                        >
                          Absent
                        </button>
                        <button
                          onClick={() => setAttStatus({ ...attStatus, [s.studentId]: "late" })}
                          className={`px-3 py-1.5 rounded-lg border-2 ${
                            attStatus[s.studentId] === "late"
                              ? "bg-amber-50 text-amber-700 border-amber-300"
                              : "bg-white border-slate-250 text-slate-500"
                          }`}
                        >
                          Late
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm shrink-0">
                <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-xs mb-4">Register Criteria</h4>
                
                <div className="space-y-4 text-xs font-sans">
                  <div>
                    <label className="text-slate-500 block mb-1">Target Class</label>
                    <select
                      value={gradeClass}
                      onChange={(e) => setGradeClass(e.target.value)}
                      className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
                    >
                      {classes.map(c => (
                        <option key={c.classId} value={c.classId}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-500 block mb-1">Selected Date</label>
                    <input
                      type="date"
                      required
                      value={attDate}
                      onChange={(e) => setAttDate(e.target.value)}
                      className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* SECTOR 3: POST HOMEWORK */}
          {activeSegment === "homework" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-2">
              <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-4">Homework Worksheets posted</h3>
                
                <div className="space-y-4">
                  {assignments.map(a => (
                    <div key={a.assignmentId} className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 dark:text-white uppercase">{a.title} ({a.subjectName})</span>
                        <span className="text-[10px] text-indigo-600 font-semibold block uppercase">Due: {a.dueDate}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">{a.description}</p>
                      <span className="text-[9px] text-slate-400 block mt-2">Class assigned: <span className="font-bold uppercase text-slate-500">{a.classId}</span></span>
                    </div>
                  ))}
                  {assignments.length === 0 && <div className="text-center py-6 text-slate-400 italic text-xs">No active assignments posted.</div>}
                </div>
              </div>

              <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-4">Post Assignment</h3>
                <form onSubmit={handleAddAssignment} className="space-y-4 text-xs font-sans">
                  <div>
                    <label className="text-slate-500 block">Class Stream</label>
                    <select
                      value={assignForm.classId}
                      onChange={(e) => setAssignForm({ ...assignForm, classId: e.target.value })}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-808 rounded-xl"
                    >
                      {classes.map(c => (
                        <option key={c.classId} value={c.classId}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">Subject Scope</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mathematics"
                      value={assignForm.subject}
                      onChange={(e) => setAssignForm({ ...assignForm, subject: e.target.value })}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">Title Header</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Quadratic Equations"
                      value={assignForm.title}
                      onChange={(e) => setAssignForm({ ...assignForm, title: e.target.value })}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">Description Instruction</label>
                    <textarea
                      required
                      value={assignForm.description}
                      onChange={(e) => setAssignForm({ ...assignForm, description: e.target.value })}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">Due Deadline Date</label>
                    <input
                      type="date"
                      required
                      value={assignForm.dueDate}
                      onChange={(e) => setAssignForm({ ...assignForm, dueDate: e.target.value })}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={assignSaving}
                    className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
                  >
                    Broadcast Worksheet
                  </button>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
