"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { ScrollToTop } from "@/components/scroll-to-top";
import { Briefcase, LogOut, Plus } from "lucide-react";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isRecruiter } = useAuth();

  return (
    <>
      <ScrollToTop />
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link
              href="/"
              className="text-xl font-extrabold tracking-tight hover:opacity-80 transition-opacity gradient-text"
            >
              jobber
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/"
                className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-teal-700 hover:bg-teal-50 transition-colors"
              >
                Find Jobs
              </Link>
              {!isRecruiter && user && (
                <Link
                  href="/profile"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-teal-700 hover:bg-teal-50 transition-colors"
                >
                  My Applications
                </Link>
              )}
              {isRecruiter && (
                <>
                  <Link
                    href="/dashboard"
                    className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-teal-700 hover:bg-teal-50 transition-colors"
                  >
                    For Employers
                  </Link>
                  <Link
                    href="/dashboard/applications"
                    className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-teal-700 hover:bg-teal-50 transition-colors"
                  >
                    Applications
                  </Link>
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {isRecruiter && (
              <Link
                href="/dashboard/new"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold btn-primary"
              >
                <Plus className="h-4 w-4" />
                Post a Job
              </Link>
            )}
            {user ? (
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline text-sm font-medium text-foreground">
                  {user.first_name}
                </span>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-teal-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-teal-700 hover:bg-teal-50 transition-colors"
              >
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-teal-500/20">
                  <Briefcase className="h-3.5 w-3.5" />
                </div>
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </header>
      {children}
    </>
  );
}
