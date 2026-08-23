"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, ClipboardList, Plus, RefreshCw, Users, UserCheck, ArrowRight } from "lucide-react";

type Job = {
  id: string;
  title: string;
  city?: string;
  district?: string | null;
  state?: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  status?: string;
  openings?: number;
  _count?: { applications?: number };
};

function money(value?: number | null) {
  return value == null ? "-" : `₹${Number(value).toLocaleString("en-IN")}`;
}

export default function EmployerDashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadJobs() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/backend/jobs/employer/my", { credentials: "include", cache: "no-store" });
      const data = await response.json().catch(() => []);
      if (!response.ok) throw new Error(data?.message || "Unable to load your jobs");
      setJobs(Array.isArray(data) ? data : data?.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load your jobs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadJobs(); }, []);

  const stats = useMemo(() => {
    const active = jobs.filter((job) => job.status === "OPEN").length;
    const applications = jobs.reduce((sum, job) => sum + (job._count?.applications ?? 0), 0);
    const openings = jobs.reduce((sum, job) => sum + (job.openings ?? 1), 0);
    return { active, applications, openings };
  }, [jobs]);

  return (
    <main className="min-h-screen bg-[#f5f7fb]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0757d8] text-white"><BriefcaseBusiness size={18} /></div>
            <div><div className="font-extrabold text-slate-900">WorkTrust</div><div className="text-[10px] text-slate-400">Employer Portal</div></div>
          </div>
          <button onClick={() => void loadJobs()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"><RefreshCw size={14} /> Refresh</button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-7">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div><p className="text-sm font-semibold text-[#0757d8]">Employer Dashboard</p><h1 className="mt-1 text-3xl font-extrabold text-slate-900">Your hiring at a glance</h1><p className="mt-1 text-sm text-slate-500">Create jobs, review applicants and find the right worker.</p></div>
          <Link href="/employer/jobs/new" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0757d8] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#0649b8]"><Plus size={17} /> Create New Job</Link>
        </div>

        {error && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          <Stat icon={<BriefcaseBusiness size={20} />} label="Active Jobs" value={stats.active} />
          <Stat icon={<ClipboardList size={20} />} label="Applications" value={stats.applications} />
          <Stat icon={<Users size={20} />} label="Worker Openings" value={stats.openings} />
        </div>

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-bold text-slate-900">Your Jobs</h2><p className="text-xs text-slate-500">Recent openings and applicant counts.</p></div><Link href="/employer/jobs" className="text-sm font-semibold text-[#0757d8]">View all <ArrowRight className="inline" size={14} /></Link></div>
          {loading ? <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Loading jobs...</div> : jobs.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50"><BriefcaseBusiness className="text-blue-600" size={22} /></div><h3 className="mt-4 font-bold text-slate-900">Your first hire starts here</h3><p className="mx-auto mt-1 max-w-md text-sm text-slate-500">Create a job for a cook, mechanic, driver, delivery worker, cleaner, mason or any practical profession.</p><Link href="/employer/jobs/new" className="mt-5 inline-flex rounded-lg bg-[#0757d8] px-4 py-2.5 text-sm font-bold text-white">Create Job</Link></div> : <div className="grid gap-4 md:grid-cols-2">{jobs.slice(0, 4).map((job) => <JobCard key={job.id} job={job} />)}</div>}
        </section>
      </div>
    </main>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#0757d8]">{icon}</div><div className="text-3xl font-extrabold text-slate-900">{value}</div></div><div className="mt-4 text-sm font-semibold text-slate-600">{label}</div></div>;
}

function JobCard({ job }: { job: Job }) {
  return <Link href={`/employer/jobs/${job.id}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-slate-900">{job.title}</h3><p className="mt-1 text-xs text-slate-500">{[job.city, job.district, job.state].filter(Boolean).join(", ") || "Location not specified"}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${job.status === "OPEN" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{job.status || "DRAFT"}</span></div><div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4"><div><p className="text-[10px] uppercase text-slate-400">Salary</p><p className="text-sm font-bold text-slate-900">{money(job.salaryMin)}{job.salaryMax ? ` - ${money(job.salaryMax)}` : ""}</p></div><div className="flex items-center gap-1 text-xs font-semibold text-slate-600"><UserCheck size={14} /> {job._count?.applications ?? 0} applicants</div></div></Link>;
}
