"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, UserRound, XCircle } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";

type Application = { id: string; status?: string; worker?: { user?: { firstName?: string; lastName?: string }; experienceYears?: number | string | null; skills?: Array<{ skill?: { name?: string } }>; addresses?: Array<{ city?: string; state?: string }> } };
type Job = { id: string; title: string; description?: string; city?: string; district?: string | null; state?: string; status?: string; skills?: Array<{ skill?: { name?: string } }> };

export default function EmployerJobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const { id } = await params;
        const response = await fetch(`/api/backend/jobs/employer/${id}/applications`, { credentials: "include", cache: "no-store" });
        const data = await response.json().catch(() => []);
        if (!response.ok) throw new Error(data?.message || "Unable to load applicants");
        setApplications(Array.isArray(data) ? data : data?.data ?? []);
        const jobsResponse = await fetch("/api/backend/jobs/employer/my", { credentials: "include", cache: "no-store" });
        const jobsData = await jobsResponse.json().catch(() => []);
        const jobs: Job[] = Array.isArray(jobsData) ? jobsData : jobsData?.data ?? [];
        setJob(jobs.find((item) => item.id === id) ?? null);
      } catch (err) { setError(err instanceof Error ? err.message : "Unable to load job"); }
      finally { setLoading(false); }
    })();
  }, [params]);

  async function updateApplication(applicationId: string, action: "shortlist" | "reject") {
    const response = await fetch(`/api/backend/jobs/employer/applications/${applicationId}/${action}`, { method: "POST", credentials: "include" });
    const data = await response.json().catch(() => null);
    if (!response.ok) { setError(data?.message || `Unable to ${action} applicant`); return; }
    setApplications((items) => items.map((item) => item.id === applicationId ? { ...item, status: action === "shortlist" ? "SHORTLISTED" : "REJECTED" } : item));
  }

  return <AdminShell>
    <div className="mb-6 flex items-center gap-3"><Link href="/employer/jobs" className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600"><ArrowLeft size={17} /></Link><div><h1 className="text-2xl font-bold text-slate-900">Job Applicants</h1><p className="mt-1 text-xs text-slate-500">Review workers and shortlist the right person.</p></div></div>
    {loading && <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Loading...</div>}
    {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    {job && <div className="mb-5 rounded-xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-lg font-bold text-slate-900">{job.title}</h2><p className="mt-1 text-sm text-slate-500">{[job.city, job.district, job.state].filter(Boolean).join(", ")}</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{job.status}</span></div><p className="mt-4 text-sm leading-6 text-slate-600">{job.description}</p><div className="mt-4 flex flex-wrap gap-2">{(job.skills ?? []).map((item, index) => <span key={index} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{item.skill?.name}</span>)}</div></div>}
    <h2 className="mb-3 text-base font-bold text-slate-900">Applicants ({applications.length})</h2>
    {applications.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">No workers have applied yet.</div> : <div className="space-y-3">{applications.map((application) => { const worker = application.worker; const name = [worker?.user?.firstName, worker?.user?.lastName].filter(Boolean).join(" ") || "Worker"; const location = worker?.addresses?.[0]; return <div key={application.id} className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div className="flex items-start gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50"><UserRound size={19} className="text-blue-600" /></div><div><div className="font-bold text-slate-900">{name}</div><div className="mt-1 text-xs text-slate-500">{worker?.experienceYears != null ? `${worker.experienceYears} years experience` : "Experience not provided"} · {location ? [location.city, location.state].filter(Boolean).join(", ") : "Location not provided"}</div><div className="mt-2 flex flex-wrap gap-1.5">{(worker?.skills ?? []).slice(0, 6).map((item, index) => <span key={index} className="rounded bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">{item.skill?.name}</span>)}</div></div></div><div className="flex items-center gap-2"><span className="mr-2 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">{application.status}</span>{application.status !== "SHORTLISTED" && application.status !== "REJECTED" && <><button onClick={() => void updateApplication(application.id, "reject")} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600"><XCircle size={14}/> Reject</button><button onClick={() => void updateApplication(application.id, "shortlist")} className="inline-flex items-center gap-1 rounded-lg bg-[#0864ec] px-3 py-2 text-xs font-semibold text-white"><CheckCircle2 size={14}/> Shortlist</button></>}</div></div></div>; })}</div>}
  </AdminShell>;
}
