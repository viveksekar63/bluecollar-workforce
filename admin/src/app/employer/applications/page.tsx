"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, CheckCircle2, MapPin, RefreshCw, Search, ShieldCheck, UserRound, XCircle } from "lucide-react";
import { EmployerShell } from "@/components/layout/employer-shell";

type Application = { id: string; status: string; appliedAt: string; job: { id: string; title: string; city?: string | null; district?: string | null; state?: string | null; openings?: number; status?: string }; worker: { id: string; workerCode?: string; experienceYears?: number | string | null; professionCategory?: string | null; profession?: string | null; verificationStatus?: string; verificationScore?: number | null; user?: { firstName?: string; lastName?: string | null; phone?: string; profilePhotoUrl?: string | null }; skills?: Array<{ skill?: { name?: string | null } }>; addresses?: Array<{ city?: string; district?: string | null; state?: string }> } };

const statusClass = (status: string) => status === "SHORTLISTED" ? "bg-emerald-50 text-emerald-700" : status === "REJECTED" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700";
const verificationClass = (status?: string) => status === "VERIFIED" ? "bg-emerald-50 text-emerald-700" : status === "FAILED" ? "bg-red-50 text-red-700" : status === "IN_PROGRESS" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600";
const formatDate = (value: string) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); };

export default function EmployerApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [jobFilter, setJobFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function loadApplications() {
    setLoading(true); setError(null);
    try {
      const response = await fetch("/api/backend/jobs/employer/applications", { credentials: "include", cache: "no-store" });
      const data = await response.json().catch(() => []);
      if (!response.ok) throw new Error(data?.message || "Unable to load applications");
      setApplications(Array.isArray(data) ? data : data?.data ?? []);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to load applications"); }
    finally { setLoading(false); }
  }

  useEffect(() => { void loadApplications(); }, []);

  const jobs = useMemo(() => { const map = new Map<string, string>(); applications.forEach((item) => map.set(item.job.id, item.job.title)); return Array.from(map.entries()); }, [applications]);
  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    return applications.filter((item) => {
      if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
      if (jobFilter !== "ALL" && item.job.id !== jobFilter) return false;
      if (!value) return true;
      const name = [item.worker.user?.firstName, item.worker.user?.lastName].filter(Boolean).join(" ");
      const skills = (item.worker.skills ?? []).map((skill) => skill.skill?.name ?? "").join(" ");
      return [name, item.worker.workerCode, item.worker.profession, item.worker.professionCategory, item.job.title, item.job.city, skills].filter(Boolean).join(" ").toLowerCase().includes(value);
    });
  }, [applications, query, statusFilter, jobFilter]);
  const counts = useMemo(() => ({ total: applications.length, applied: applications.filter((item) => item.status === "APPLIED").length, shortlisted: applications.filter((item) => item.status === "SHORTLISTED").length, rejected: applications.filter((item) => item.status === "REJECTED").length }), [applications]);

  async function updateApplication(applicationId: string, action: "shortlist" | "reject") {
    setUpdatingId(applicationId); setError(null);
    try {
      const response = await fetch(`/api/backend/jobs/employer/applications/${applicationId}/${action}`, { method: "POST", credentials: "include" });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || `Unable to ${action} applicant`);
      setApplications((items) => items.map((item) => item.id === applicationId ? { ...item, status: action === "shortlist" ? "SHORTLISTED" : "REJECTED" } : item));
    } catch (err) { setError(err instanceof Error ? err.message : `Unable to ${action} applicant`); }
    finally { setUpdatingId(null); }
  }

  return <EmployerShell>
    <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-sm font-semibold text-[#0757d8]">Hiring</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Applications</h1><p className="mt-1 text-sm text-slate-500">Review applicants across all your job openings.</p></div><button onClick={() => void loadApplications()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh</button></div>
    {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    <div className="grid gap-3 sm:grid-cols-4"><SummaryCard label="Total applications" value={counts.total} /><SummaryCard label="Awaiting review" value={counts.applied} /><SummaryCard label="Shortlisted" value={counts.shortlisted} /><SummaryCard label="Rejected" value={counts.rejected} /></div>
    <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-col gap-3 lg:flex-row"><div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search worker, job, profession or skill..." className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#0757d8]" /></div><select value={jobFilter} onChange={(event) => setJobFilter(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none"><option value="ALL">All jobs</option>{jobs.map(([id, title]) => <option key={id} value={id}>{title}</option>)}</select><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none"><option value="ALL">All statuses</option><option value="APPLIED">Applied</option><option value="SHORTLISTED">Shortlisted</option><option value="REJECTED">Rejected</option></select></div></div>
    <div className="mt-5">{loading ? <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">Loading applications...</div> : filtered.length === 0 ? <EmptyState /> : <div className="space-y-3">{filtered.map((application) => <ApplicationCard key={application.id} application={application} updating={updatingId === application.id} onShortlist={() => void updateApplication(application.id, "shortlist")} onReject={() => void updateApplication(application.id, "reject")} />)}</div>}</div>
  </EmployerShell>;
}

function SummaryCard({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="text-xs font-medium text-slate-500">{label}</div><div className="mt-2 text-2xl font-extrabold text-slate-900">{value}</div></div>; }
function EmptyState() { return <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50"><BriefcaseBusiness size={21} className="text-blue-600" /></div><h2 className="mt-4 text-base font-bold text-slate-900">No applications found</h2><p className="mt-1 text-sm text-slate-500">Try changing the filters or wait for workers to apply to your published jobs.</p></div>; }

function ApplicationCard({ application, updating, onShortlist, onReject }: { application: Application; updating: boolean; onShortlist: () => void; onReject: () => void }) {
  const worker = application.worker;
  const name = [worker.user?.firstName, worker.user?.lastName].filter(Boolean).join(" ") || "Worker";
  const address = worker.addresses?.[0];
  const location = [address?.city, address?.district, address?.state].filter(Boolean).join(", ");
  const experience = worker.experienceYears != null ? `${worker.experienceYears} yrs experience` : "Experience not provided";
  const verification = worker.verificationStatus || "PENDING";
  const skills = (worker.skills ?? []).map((item) => item.skill?.name).filter(Boolean).slice(0, 6);
  return <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between"><div className="flex min-w-0 gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-[#0757d8]">{worker.user?.profilePhotoUrl ? <img src={worker.user.profilePhotoUrl} alt={name} className="h-full w-full object-cover" /> : <UserRound size={20} />}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="text-base font-bold text-slate-900">{name}</h2>{worker.workerCode && <span className="text-[11px] font-medium text-slate-400">{worker.workerCode}</span>}</div><div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">{worker.profession && <span>{worker.profession}</span>}<span>{experience}</span>{location && <span className="inline-flex items-center gap-1"><MapPin size={12} />{location}</span>}</div><div className="mt-3 flex flex-wrap items-center gap-2"><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${verificationClass(verification)}`}><ShieldCheck size={12} /> {verification.replace("_", " ")}{worker.verificationScore != null && ` · ${worker.verificationScore}%`}</span>{skills.map((skill) => <span key={skill} className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">{skill}</span>)}</div></div></div><div className="flex shrink-0 flex-col items-start gap-3 xl:items-end"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusClass(application.status)}`}>{application.status}</span><span className="text-[11px] text-slate-400">Applied {formatDate(application.appliedAt)}</span></div>{application.status === "APPLIED" && <div className="flex gap-2"><button disabled={updating} onClick={onReject} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"><XCircle size={14} /> Reject</button><button disabled={updating} onClick={onShortlist} className="inline-flex items-center gap-1.5 rounded-lg bg-[#0757d8] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0649b8] disabled:opacity-50"><CheckCircle2 size={14} /> Shortlist</button></div>}</div></div><div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between"><div className="text-xs text-slate-500">Applied for <span className="font-semibold text-slate-800">{application.job.title}</span>{application.job.city && <span> · {application.job.city}</span>}</div><Link href={`/employer/jobs/${application.job.id}`} className="text-xs font-bold text-[#0757d8] hover:underline">View job & applicants →</Link></div></div>;
}
