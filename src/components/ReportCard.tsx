import React, { useRef } from "react";
import { Result, Student, School } from "../types";
import { Printer, Calendar, Award, CheckCircle, AlertOctagon } from "lucide-react";

interface ReportCardProps {
  student: Student;
  school: School | null;
  results: Result[];
  onGenerateAIComment?: (subject: string, score: number) => Promise<string>;
}

export default function ReportCard({ student, school, results, onGenerateAIComment }: ReportCardProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // Math calculators for metrics
  const totalSubjects = results.length;
  const grandTotal = results.reduce((acc, curr) => acc + curr.totalScore, 0);
  const averageAggregate = totalSubjects > 0 ? (grandTotal / totalSubjects).toFixed(1) : "0.0";

  // Classifications
  const getAverageGrade = (avgStr: string) => {
    const avg = parseFloat(avgStr);
    if (avg >= 80) return "A (Excellent)";
    if (avg >= 70) return "B (Very Good)";
    if (avg >= 60) return "C (Good)";
    if (avg >= 50) return "D (Pass)";
    return "F (Needs Improvement)";
  };

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    const originalContent = document.body.innerHTML;

    if (printContent) {
      const win = window.open("", "_blank");
      if (win) {
        win.document.open();
        win.document.write(`
          <html>
            <head>
              <title>Academic Report Card - ${student.name}</title>
              <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
              <style>
                @media print {
                  body { padding: 20px; color-adjust: exact; -webkit-print-color-adjust: exact; }
                  .no-print { display: none !important; }
                }
              </style>
            </head>
            <body class="bg-white text-slate-800 p-8">
              ${printContent}
              <script>
                window.onload = function() {
                  window.print();
                  window.close();
                }
              </script>
            </body>
          </html>
        `);
        win.document.close();
      }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm font-sans transition-colors duration-200">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
        <div>
          <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-100 flex items-center space-x-2">
            <Award className="h-5 w-5 text-blue-600" />
            <span>Academic Performance Record</span>
          </h3>
          <p className="text-slate-400 text-xs mt-0.5">
            View or print computed continuous assessments and terminal reports
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center space-x-2 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 transition"
          id="print-report-btn"
        >
          <Printer className="h-4 w-4" />
          <span>Print report sheet</span>
        </button>
      </div>

      {/* Actual Report Sheet Area (Print Target) */}
      <div ref={printRef} className="space-y-6">
        {/* Institutional Letterhead */}
        <div className="border-4 border-slate-900 p-4 rounded-xl dark:border-slate-400">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold tracking-tight uppercase text-slate-900 dark:text-slate-100">
              {school ? school.name : "BEST INTERNATIONAL SCHOOLS"}
            </h1>
            <p className="text-xs font-medium italic opacity-80 select-none">
              Motto: {school?.motto || "Knowledge, Character, Excellence"}
            </p>
            <p className="text-[10px] opacity-60">
              {school?.address || "Educational District Headquarters, Lagos"}
            </p>
            <div className="w-full bg-slate-900 dark:bg-slate-400 h-1 my-3" />
            <h2 className="text-sm font-bold tracking-widest uppercase">
              Official Student Report Card
            </h2>
          </div>

          {/* Student Dossier Information */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-sans mt-6 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-lg border border-slate-100 dark:border-slate-850">
            <div>
              <span className="text-slate-400 block uppercase tracking-wider text-[9px] font-semibold">Student Name</span>
              <span className="font-bold text-slate-800 dark:text-slate-100">{student.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase tracking-wider text-[9px] font-semibold">Assigned Class</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200 uppercase">{student.classId}</span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase tracking-wider text-[9px] font-semibold">Birth Certificate</span>
              <span className="text-slate-700 dark:text-slate-300">{student.dob}</span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase tracking-wider text-[9px] font-semibold">Terminal Cycle</span>
              <span className="text-slate-700 dark:text-slate-300 font-medium">Session 2025/2026</span>
            </div>
          </div>

          {/* Grades Grid Table */}
          <div className="mt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white dark:bg-slate-800 border-none text-[10px] uppercase font-mono tracking-wider">
                    <th className="p-3 rounded-l-md font-semibold">Subject</th>
                    <th className="p-3 text-center font-semibold">CA (30%)</th>
                    <th className="p-3 text-center font-semibold">Exam (70%)</th>
                    <th className="p-3 text-center font-semibold">Total (100)</th>
                    <th className="p-3 text-center font-semibold">Grade</th>
                    <th className="p-3 rounded-r-md font-semibold">Academic Comments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                  {results.length > 0 ? (
                    results.map((res) => (
                      <tr key={res.resultId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{res.subjectName}</td>
                        <td className="p-3 text-center font-mono text-slate-600 dark:text-slate-300">{res.caScore}</td>
                        <td className="p-3 text-center font-mono text-slate-600 dark:text-slate-300">{res.examScore}</td>
                        <td className="p-3 text-center font-bold text-blue-600 dark:text-blue-400 font-mono">{res.totalScore}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded font-bold text-xs uppercase ${
                            res.grade === 'A' ? 'bg-emerald-50 text-emerald-700' :
                            res.grade === 'B' ? 'bg-teal-50 text-teal-700' :
                            res.grade === 'C' ? 'bg-cyan-50 text-cyan-700' :
                            res.grade === 'D' ? 'bg-amber-50 text-amber-700' :
                            'bg-rose-50 text-rose-700'
                          }`}>
                            {res.grade}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300 italic">{res.remark}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                        No continuous assessment scores on file for this terminal range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Academic Summary Indices */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-2 border-slate-900 dark:border-slate-700 p-4 rounded-xl mt-6">
            <div className="text-center py-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400 block">Calculated Total</span>
              <span className="text-lg font-bold text-slate-800 dark:text-slate-200">{grandTotal} / {totalSubjects * 100}</span>
            </div>
            <div className="text-center py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border-l md:border-l-0">
              <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400 block">Class Average</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{averageAggregate}%</span>
            </div>
            <div className="text-center py-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400 block">Final Recommendation</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase">{getAverageGrade(averageAggregate)}</span>
            </div>
          </div>

          {/* Institutional Affirmation Sign-offs */}
          <div className="flex justify-between items-center mt-12 pt-6 border-t border-dashed border-slate-300 dark:border-slate-800 text-xs">
            <div className="text-center space-y-4 w-1/3">
              <div className="h-0.5 bg-slate-900/60 dark:bg-slate-600 mx-auto w-3/4" />
              <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">Class Teacher Sign-off</span>
            </div>
            <div className="text-center space-y-4 w-1/3">
              <div className="h-0.5 bg-slate-900/60 dark:bg-slate-600 mx-auto w-3/4" />
              <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">School Director Stamp</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
