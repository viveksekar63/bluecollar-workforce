"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BriefcaseBusiness, Loader2, ShieldCheck } from "lucide-react";

export default function EmployerLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/employer/dashboard";
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/employer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to sign in");

      router.replace(returnUrl.startsWith("/") ? returnUrl : "/employer/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#062c6f] via-[#0757d8] to-[#eaf2ff] p-6">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-2">
        <div className="hidden bg-[#062c6f] p-10 text-white md:block">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
            <BriefcaseBusiness size={27} />
          </div>
          <h1 className="mt-12 text-4xl font-extrabold">WorkTrust</h1>
          <p className="mt-3 text-blue-100">Find the right people for the job.</p>
          <div className="mt-16 space-y-5 text-sm text-blue-100">
            <p>✓ Hire verified blue-collar workers</p>
            <p>✓ Create jobs in minutes</p>
            <p>✓ Manage applicants easily</p>
            <p>✓ Shortlist and hire with confidence</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-9 md:p-12">
          <div className="flex items-center gap-2 text-[#0757d8] md:hidden">
            <BriefcaseBusiness size={20} />
            <span className="font-extrabold">WorkTrust</span>
          </div>
          <h2 className="mt-5 text-2xl font-bold text-slate-900 md:mt-0">Employer Login</h2>
          <p className="mt-1 text-sm text-slate-500">Sign in to manage your jobs and applicants.</p>

          <div className="mt-8 space-y-4">
            <input
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              placeholder="Email or mobile number"
            />
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              placeholder="Password"
            />
            {error && <div className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700">{error}</div>}
            <button
              disabled={loading}
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0757d8] p-3 text-sm font-bold text-white hover:bg-[#0649b8] disabled:opacity-60"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </div>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck size={14} /> Verified employer access
          </div>
        </form>
      </div>
    </main>
  );
}
