"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { authRegister } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Mail, Lock, User, Building2 } from "lucide-react";

export default function RecruiterRegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    company: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authRegister({
        ...form,
        role: "recruiter",
      });
      login(res.token, res.user);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gradient-to-b from-coral-50/40 to-white px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Register your company</h1>
          <p className="text-sm text-muted-foreground mt-1">Start posting jobs and finding talent</p>
        </div>

        <div className="rounded-xl border border-coral-200/60 bg-white p-6 shadow-sm shadow-coral-500/5">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Company name</label>
              <div className="relative mt-1">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-coral-500" />
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-coral-200/60 text-sm focus:outline-none focus:ring-2 focus:ring-coral-300/30 focus:border-coral-300 transition-colors"
                  placeholder="Acme Inc."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Your name</label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-coral-500" />
                  <input
                    type="text"
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-coral-200/60 text-sm focus:outline-none focus:ring-2 focus:ring-coral-300/30 focus:border-coral-300 transition-colors"
                    placeholder="Erick"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Last name</label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-coral-500" />
                  <input
                    type="text"
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-coral-200/60 text-sm focus:outline-none focus:ring-2 focus:ring-coral-300/30 focus:border-coral-300 transition-colors"
                    placeholder="Reyes"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Work email</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-coral-500" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-coral-200/60 text-sm focus:outline-none focus:ring-2 focus:ring-coral-300/30 focus:border-coral-300 transition-colors"
                  placeholder="erick@acme.com"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Password</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-coral-500" />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-coral-200/60 text-sm focus:outline-none focus:ring-2 focus:ring-coral-300/30 focus:border-coral-300 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full btn-accent"
            >
              {loading ? "Creating account..." : "Create Company Account"}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-medium text-teal-600 hover:text-teal-700 hover:underline">
            Sign in
          </Link>
        </p>
        <p className="text-center text-sm text-muted-foreground mt-2">
          <Link href="/auth/register" className="font-medium text-teal-600 hover:text-teal-700 hover:underline">
            Looking for a job? Sign up as candidate
          </Link>
        </p>
      </div>
    </div>
  );
}
