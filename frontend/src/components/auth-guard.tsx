"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AuthGuard({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: "candidate" | "recruiter";
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/auth/login");
      return;
    }
    if (requiredRole && user.role !== requiredRole) {
      router.push(user.role === "recruiter" ? "/dashboard" : "/");
    }
  }, [user, loading, requiredRole, router]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <svg className="animate-spin h-5 w-5 text-muted-foreground" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>
    );
  }

  if (!user) return null;
  if (requiredRole && user.role !== requiredRole) return null;

  return <>{children}</>;
}
