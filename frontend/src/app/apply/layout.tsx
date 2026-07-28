"use client";

import { AuthGuard } from "@/components/auth-guard";

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard requiredRole="candidate">{children}</AuthGuard>;
}
