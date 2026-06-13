import React, { useState } from "react";
import { GraduationCap, LogIn, Sparkles, Building2, UserCheck } from "lucide-react";
import { UserRole } from "../types";

interface LoginViewProps {
  onLogin: (email: string, role: UserRole, demoMode: boolean) => void;
  onGoogleLogin: () => void;
  loading: boolean;
}

export default function LoginView({ onLogin, onGoogleLogin, loading }: LoginViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("school-admin");

  // Preloaded credentials indices for easy demonstration
  const demoAccounts = [
    { role: "super-admin" as UserRole, name: "System Owner", email: "emmanuelsunday2003@gmail.com", label: "Super Admin" },
    { role: "school-admin" as UserRole, name: "Dr. Adebayo (Principal)", email: "admin@bestacademy.edu", label: "School Principal" },
    { role: "teacher" as UserRole, name: "Mrs. Jenkins (Math teacher)", email: "sarah.jenkins@bestschool.edu", label: "Teacher Account" },
    { role: "student" as UserRole, name: "Zainab (Primary 5)", email: "student-1@bestschool.edu", label: "Student Terminal" },
    { role: "parent" as UserRole, name: "Alhaji Haruna (Parent)", email: "parent1@demo.com", label: "Parent Terminal" }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    onLogin(email, role, false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 flex items-center justify-center p-4 sm:p-6 font-sans antialiased text-slate-800 transition-colors duration-200">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-slate-950 rounded-3xl shadow-2xl overflow-hidden border border-white/10">
        
        {/* Left Column: SaaS Branding Hero Banner */}
        <div className="lg:col-span-5 bg-gradient-to-b from-blue-700 to-indigo-900 p-8 sm:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle bg overlay */}
          <div className="absolute inset-0 bg-blue-900/10 pointer-events-none" />
          <div className="absolute -left-12 -top-12 h-64 w-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-4 relative z-10">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
              <GraduationCap className="h-7 w-7 text-blue-200" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Best School Manager</h1>
              <p className="text-blue-200/90 text-sm mt-2">
                The ultimate multi-school platform. Secured database tenant isolation, real-time finance ledgers, and Gemini AI-driven student reports.
              </p>
            </div>
          </div>

          <div className="space-y-6 mt-12 relative z-10">
            <div className="flex items-start space-x-3 text-xs bg-white/5 border border-white/10 p-3 rounded-xl backdrop-blur-sm">
              <Sparkles className="h-5 w-5 text-amber-300 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-white/95">GenAI Performance Assessment</span>
                <p className="text-white/70 mt-0.5">Generate analytical academic progress comments and institutional administrative metrics with Google Gemini.</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 text-blue-200/80 text-[10px] font-mono">
              <Building2 className="h-4 w-4" />
              <span>Multi-Tenant Sandbox Active</span>
            </div>
          </div>
        </div>

        {/* Right Column: Authentication Card Forms */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center bg-slate-50 dark:bg-slate-900 transition-colors">
          <div className="max-w-md w-full mx-auto space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Secure Console Login
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                Enter your licensed coordinates below or click an instant demo pilot account.
              </p>
            </div>

            {/* Simple standard credentials login */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  System Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full h-11 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-200 shadow-sm transition"
                  id="login-role-selector"
                >
                  <option value="school-admin">School Owner / Principal</option>
                  <option value="teacher">Academic Teacher Team</option>
                  <option value="student">Student Portal</option>
                  <option value="parent">Parental Console</option>
                  <option value="super-admin">Platform Super Admin</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  Registered Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. principal@bestacademy.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-200 shadow-sm transition"
                  id="login-email-input"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  Secure Password
                </label>
                <input
                  type="password"
                  placeholder="Password (auto-filled in Demo Mode)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 px-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-200 shadow-sm transition"
                  id="login-password-input"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl py-2 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 flex items-center justify-center space-x-2 transition disabled:opacity-50"
                  id="submit-login-btn"
                >
                  <LogIn className="h-4 w-4" />
                  <span>{loading ? "Authenticating..." : "Sign In to School"}</span>
                </button>
              </div>
            </form>

            {/* Google Identity Sign-In Trigger */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              <span className="flex-shrink mx-4 text-[10px] text-slate-400 font-mono uppercase tracking-widest">
                Identity Providers
              </span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            </div>

            <button
              onClick={onGoogleLogin}
              disabled={loading}
              className="w-full h-11 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl text-sm font-semibold flex items-center justify-center space-x-3 transition shadow-sm"
              id="google-login-btn"
            >
              {/* Google SVG Vector */}
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.53-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-8.77z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.08 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.15C3.26 21.17 7.37 24 12 24z"/>
                <path fill="#FBBC05" d="M5.27 14.24A7.16 7.16 0 0 1 4.86 12c0-.79.13-1.57.38-2.31V6.54H1.29A11.94 11.94 0 0 0 0 12c0 1.92.45 3.74 1.29 5.46l3.98-3.22z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.26 2.83 1.29 6.54l3.98 3.22c.95-2.85 3.6-4.96 6.73-4.96z"/>
              </svg>
              <span>{loading ? "Connecting..." : "Continue with Google Workspace"}</span>
            </button>

            {/* Instant Demonstration Admin Selector Panels */}
            <div className="space-y-3 bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-150 dark:border-slate-850">
              <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 block uppercase">
                Demo Account Shortcuts
              </span>
              <p className="text-[11px] text-slate-400">
                Click any shortcut below to instantly login as that role with automatic seeder records.
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 pt-1 select-none">
                {demoAccounts.map((ac) => (
                  <button
                    key={ac.role + "-" + ac.email}
                    onClick={() => onLogin(ac.email, ac.role, true)}
                    type="button"
                    className="p-2 text-left bg-slate-50 hover:bg-blue-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-medium text-slate-700 dark:text-slate-300 flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-900 transition"
                  >
                    <span className="font-bold flex items-center text-blue-600 dark:text-blue-400">
                      <UserCheck className="h-3 w-3 mr-1" />
                      {ac.label}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 truncate w-full">{ac.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
