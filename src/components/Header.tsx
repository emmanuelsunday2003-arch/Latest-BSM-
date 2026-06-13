import React from "react";
import { UserProfile, School } from "../types";
import { LogOut, Sun, Moon, Award, GraduationCap } from "lucide-react";

interface HeaderProps {
  user: UserProfile | null;
  school: School | null;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onLogout: () => void;
}

export default function Header({ user, school, darkMode, setDarkMode, onLogout }: HeaderProps) {
  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-16 px-6 flex items-center justify-between sticky top-0 z-40 transition-colors duration-200">
      {/* Brand & Connected School Identification */}
      <div className="flex items-center space-x-3">
        <GraduationCap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        <div>
          <span className="font-sans font-bold text-lg text-slate-800 dark:text-slate-100 tracking-tight">
            Best School Manager
          </span>
          {school && (
            <span className="hidden sm:inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-100 dark:border-blue-900 ml-3">
              {school.name}
            </span>
          )}
        </div>
      </div>

      {/* Profile, Action Buttons & Styling Toggles */}
      <div className="flex items-center space-x-4">
        {/* Dark Mode Switcher */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="Toggle Light/Dark Theme"
          id="theme-toggle-btn"
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* User Card */}
        {user ? (
          <div className="flex items-center space-x-3 border-l border-slate-200 dark:border-slate-800 pl-4">
            <div className="flex flex-col items-end hidden md:flex">
              <span className="font-sans font-semibold text-sm text-slate-800 dark:text-slate-200">
                {user.name}
              </span>
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center space-x-1">
                <Award className="h-3 w-3 mr-0.5 text-blue-500" />
                {user.role}
              </span>
            </div>
            
            {/* Visual Profile Avatar */}
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-sans font-bold flex items-center justify-center shadow-sm">
              {user.name.substring(0, 2).toUpperCase()}
            </div>

            {/* Logout Action */}
            <button
              onClick={onLogout}
              className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition ml-2"
              title="Sign Out"
              id="logout-btn"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="text-sm font-sans text-slate-400 italic">Offline Mode</div>
        )}
      </div>
    </header>
  );
}
