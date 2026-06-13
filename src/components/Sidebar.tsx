import React from "react";
import { UserProfile } from "../types";
import { 
  Building2, 
  Users, 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  Wallet, 
  FileCheck, 
  Megaphone, 
  ClipboardList, 
  TrendingUp, 
  Briefcase, 
  CreditCard,
  Layers,
  Sparkles,
  Award
} from "lucide-react";

interface SidebarProps {
  user: UserProfile | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
}

export default function Sidebar({ user, activeTab, setActiveTab }: SidebarProps) {
  if (!user) return null;

  // Compile navlist based on user role
  const getNavItems = (): NavItem[] => {
    switch (user.role) {
      case "super-admin":
        return [
          { id: "sa-overview", label: "Global Dashboard", icon: Layers },
          { id: "sa-schools", label: "SaaS School Registry", icon: Building2 },
          { id: "sa-users", label: "User Accounts", icon: Users },
          { id: "sa-billing", label: "SaaS Subscription Tracing", icon: CreditCard }
        ];
      case "school-admin":
        return [
          { id: "overview", label: "School Dashboard", icon: TrendingUp },
          { id: "classes", label: "Academic Classes", icon: BookOpen },
          { id: "teachers", label: "Teachers Roster", icon: Briefcase },
          { id: "students", label: "Students Registry", icon: Users },
          { id: "parents", label: "Parents Index", icon: GraduationCap },
          { id: "finance", label: "Finance & Accounts", icon: Wallet },
          { id: "attendance", label: "Attendance Registers", icon: Calendar },
          { id: "results", label: "Continuous Assessment & Exam results", icon: FileCheck },
          { id: "assignments", label: "Homework", icon: ClipboardList },
          { id: "announcements", label: "Announcements", icon: Megaphone },
          { id: "ai-copilot", label: "AI School Insights", icon: Sparkles }
        ];
      case "teacher":
        return [
          { id: "overview", label: "Teacher Dashboard", icon: TrendingUp },
          { id: "classes", label: "My Classes", icon: BookOpen },
          { id: "students", label: "My Students", icon: Users },
          { id: "results", label: "CA & Exam Grades", icon: FileCheck },
          { id: "attendance", label: "Mark Attendance", icon: Calendar },
          { id: "assignments", label: "Class Assignments", icon: ClipboardList },
          { id: "ai-copilot", label: "AI Comment Generator", icon: Sparkles }
        ];
      case "student":
        return [
          { id: "students-dashboard", label: "Student Terminal", icon: TrendingUp },
          { id: "results", label: "My Performance & Reports", icon: Award },
          { id: "attendance", label: "Attendance Record", icon: Calendar },
          { id: "assignments", label: "Learning Assignments", icon: ClipboardList },
          { id: "finance-view", label: "Tuition Invoice Tracking", icon: Wallet },
          { id: "announcements-view", label: "Class Bulletins", icon: Megaphone },
          { id: "ai-copilot", label: "AI Performance Tutor", icon: Sparkles }
        ];
      case "parent":
        return [
          { id: "parent-dashboard", label: "Parent Terminal", icon: GraduationCap },
          { id: "results", label: "Child performance cards", icon: FileCheck },
          { id: "attendance", label: "Child Daily Attendance", icon: Calendar },
          { id: "finance-view", label: "School Tuition Invoicing", icon: Wallet },
          { id: "announcements-view", label: "School News", icon: Megaphone }
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)] sticky top-16 z-30 font-sans select-none overflow-y-auto">
      <div className="py-6 px-4 space-y-6">
        <div>
          <span className="text-xs font-mono tracking-widest uppercase text-slate-500 block px-3">
            Navigation Console
          </span>
          <nav className="mt-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  id={`nav-tab-${item.id}`}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-150 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-slate-800/80 bg-slate-950/30 flex flex-col items-center">
        <span className="text-xs font-mono text-slate-500 text-center">
          Best School Manager v1.0.0
        </span>
        <span className="text-[10px] font-mono text-slate-600 text-center mt-1">
          Secure Tenant Guard Isolation Enabled
        </span>
      </div>
    </aside>
  );
}
