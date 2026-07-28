"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { authRegister } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Mail, Lock, User, Phone } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    phone: "",
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
        role: "candidate",
      });
      login(res.token, res.user);
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gradient-to-b from-gray-50 to-white px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
          <p className="text-sm text-muted-foreground mt-1">Start applying to your dream jobs</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm shadow-teal-500/5">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">First name</label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-400" />
                  <input
                    type="text"
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300/30 focus:border-teal-300 transition-colors"
                    placeholder="Erick"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Last name</label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-400" />
                  <input
                    type="text"
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300/30 focus:border-teal-300 transition-colors"
                    placeholder="Reyes"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Email</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300/30 focus:border-teal-300 transition-colors"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Password</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-400" />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300/30 focus:border-teal-300 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Phone (optional)</label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-400" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300/30 focus:border-teal-300 transition-colors"
                  placeholder="8123456789"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full btn-primary"
            >
              {loading ? "Creating account..." : "Create Account"}
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
          <Link href="/auth/recruiter" className="font-medium text-coral-600 hover:text-coral-700 hover:underline">
            Register as a company
          </Link>
        </p>
      </div>
    </div>
  );
}
