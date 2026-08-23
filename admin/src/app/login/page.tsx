"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Loader2, BriefcaseBusiness } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Invalid email or password");
      router.replace(returnUrl.startsWith("/") ? returnUrl : "/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#062c6f] via-[#0757d8] to-[#eaf2ff] p-6">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-2">
        <div className="hidden bg-[#062c6f] p-10 text-white md:block">
          <ShieldCheck size={48}/>
          <h1 className="mt-12 text-4xl font-extrabold">WorkTrust</h1>
          <p className="mt-3 text-blue-100">Verified people. Trusted work.</p>
          <div className="mt-16 space-y-5 text-sm text-blue-100">
            <p>✓ Verified blue-collar workers</p>
            <p>✓ Employment history checks</p>
            <p>✓ Secure document management</p>
            <p>✓ Employer-ready profiles</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-9 md:p-12">
          <h2 className="text-2xl font-bold">Welcome back</h2>
          <p className="mt-1 text-sm text-slate-500">Sign in to your admin account</p>

          <div className="mt-8 space-y-4">
            <input required type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border p-3 text-sm outline-none focus:border-blue-600" placeholder="Email address" />
            <input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border p-3 text-sm outline-none focus:border-blue-600" placeholder="Password" />
            {error && <div className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700">{error}</div>}
            <button disabled={loading} type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0757d8] p-3 text-sm font-bold text-white disabled:opacity-60">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </div>

          <div className="mt-7 border-t border-slate-100 pt-5 text-center">
            <p className="text-xs text-slate-400">Are you hiring workers?</p>
            <Link href="/employer/login" className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-[#0757d8] hover:underline">
              <BriefcaseBusiness size={15} /> Employer Login
            </Link>
          </div>
          <p className="mt-5 text-center text-xs text-slate-400">Protected admin access • WorkTrust</p>
        </form>
      </div>
    </main>
  );
}
