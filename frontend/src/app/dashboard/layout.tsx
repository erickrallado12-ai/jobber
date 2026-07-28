"use client";

import { AuthGuard } from "@/components/auth-guard";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard requiredRole="recruiter">{children}</AuthGuard>;
}
