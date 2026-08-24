"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Award,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  FileText,
  GraduationCap,
  Languages,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";
import { EmployerShell } from "@/components/layout/employer-shell";

type Applicant = {
  id: string;
  status: string;
  appliedAt: string;
  shortlistedAt?: string | null;
  rejectedAt?: string | null;
  job: {
    id: string;
    title: string;
    description: string;
    city: string;
    district?: string | null;
    state: string;
    pincode?: string | null;
    salaryMin?: number | string | null;
    salaryMax?: number | string | null;
    salaryType: string;
    openings: number;
    startDate?: string | null;
    endDate?: string | null;
    status: string;
    skills: Array<{ skill?: { name?: string | null } }>;
  };
  worker: {
    id: string;
    workerCode: string;
    dateOfBirth?: string | null;
    gender?: string | null;
    maritalStatus?: string | null;
    bio?: string | null;
    experienceYears?: number | string | null;
    professionCategory?: string | null;
    profession?: string | null;
    profileCompletion: number;
    verificationStatus: string;
    verificationScore?: number | null;
    availabilityStatus: string;
    createdAt: string;
    user: { firstName: string; lastName?: string | null; email?: string | null; phone?: string | null; profilePhotoUrl?: string | null; status: string };
    addresses: Array<{ id: string; type: string; addressLine1: string; addressLine2?: string | null; city: string; district?: string | null; state: string; pincode: string; isCurrent: boolean }>;
    skills: Array<{ skillLevel: string; experienceYears?: number | string | null; verified: boolean; skill?: { name?: string | null; category?: string | null } }>;
    education: Array<{ id: string; qualification: string; institution?: string | null; fieldOfStudy?: string | null; startYear?: number | null; endYear?: number | null; verified: boolean }>;
    certifications: Array<{ id: string; name: string; issuingBody?: string | null; certificateNo?: string | null; issuedDate?: string | null; expiryDate?: string | null; verified: boolean }>;
    languages: Array<{ proficiency: string; language?: { name?: string | null } }>;
    employmentHistory: Array<{
      id: string;
      companyName: string;
      companyAddress?: string | null;
      designation: string;
      startDate: string;
      endDate?: string | null;
      salary?: number | string | null;
      employmentType?: string | null;
      reasonForLeaving?: string | null;
      verificationStatus: string;
      references: Array<{ id: string; name: string; designation?: string | null; relationship?: string | null; verificationStatus: string }>;
      documents: Array<{ document: { id: string; type: string; fileName: string; mimeType: string; fileSize: number; documentNumber?: string | null; verificationStatus: string; uploadedAt: string; verifiedAt?: string | null } }>;
    }>;
    documents: Array<{ id: string; type: string; fileName: string; mimeType: string; fileSize: number; documentNumber?: string | null; verificationStatus: string; uploadedAt: string; verifiedAt?: string | null; verification?: { provider?: string | null; status: string; remarks?: string | null; verifiedAt?: string | null } | null }>;
    verificationRequests: Array<{
      id: string;
      status: string;
      overallScore?: number | null;
      startedAt?: string | null;
      completedAt?: string | null;
      createdAt: string;
      checks: Array<{ id: string; type: string; status: string; provider?: string | null; startedAt?: string | null; completedAt?: string | null; result?: { result: string; score?: number | null; remarks?: string | null } | null }>;
    }>;
  };
};

const statusClass = (status: string) => status === "SHORTLISTED" ? "bg-emerald-50 text-emerald-700" : status === "REJECTED" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700";
const verificationClass = (status?: string) => status === "VERIFIED" ? "bg-emerald-50 text-emerald-700" : status === "FAILED" ? "bg-red-50 text-red-700" : status === "IN_PROGRESS" || status === "MANUAL_REVIEW" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600";
const pretty = (value?: string | null) => value ? value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()) : "—";
const formatDate = (value?: string | null) => { if (!value) return "—"; const date = new Date(value); return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); };
const formatSalary = (min?: number | string | null, max?: number | string | null) => { const a = min == null ? null : Number(min); const b = max == null ? null : Number(max); if (a == null && b == null) return "Not specified"; const fmt = (v: number) => `₹${v.toLocaleString("en-IN")}`; if (a != null && b != null) return `${fmt(a)} – ${fmt(b)}`; return fmt(a ?? b!); };

export default function EmployerApplicantDetailsPage() {
  const params = useParams<{ applicationId: string }>();
  const router = useRouter();
  const applicationId = params?.applicationId;
  const [data, setData] = useState<Applicant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  async function load() {
    if (!applicationId) return;
    setLoading(true); setError(null);
    try {
      const response = await fetch(`/api/backend/jobs/employer/applications/${applicationId}`, { credentials: "include", cache: "no-store" });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message || "Unable to load applicant");
      setData(body);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to load applicant"); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [applicationId]);

  async function updateStatus(action: "shortlist" | "reject") {
    if (!applicationId) return;
    setUpdating(true); setError(null);
    try {
      const response = await fetch(`/api/backend/jobs/employer/applications/${applicationId}/${action}`, { method: "POST", credentials: "include" });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message || `Unable to ${action} applicant`);
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : `Unable to ${action} applicant`); }
    finally { setUpdating(false); }
  }

  if (loading) return <EmployerShell><div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">Loading applicant profile...</div></EmployerShell>;
  if (error || !data) return <EmployerShell><div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error || "Applicant not found"}</div><button onClick={() => router.back()} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#0757d8]"><ArrowLeft size={15} /> Back</button></EmployerShell>;

  const worker = data.worker;
  const name = [worker.user.firstName, worker.user.lastName].filter(Boolean).join(" ") || "Worker";
  const currentAddress = worker.addresses.find((item) => item.isCurrent) ?? worker.addresses[0];
  const latestVerification = worker.verificationRequests[0];
  const verificationChecks = latestVerification?.checks ?? [];
  const verificationDone = verificationChecks.filter((item) => ["VERIFIED", "FAILED"].includes(item.status)).length;
  const jobSkills = data.job.skills.map((item) => item.skill?.name).filter(Boolean) as string[];
  const matchingSkills = useMemo(() => { const workerSkills = new Set(worker.skills.map((item) => item.skill?.name?.toLowerCase()).filter(Boolean)); return jobSkills.filter((skill) => workerSkills.has(skill.toLowerCase())); }, [jobSkills, worker.skills]);

  return <EmployerShell>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#0757d8]"><ArrowLeft size={16} /> Back to applications</button>
      <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${statusClass(data.status)}`}>{pretty(data.status)}</span>
    </div>

    {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-5">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-blue-50 text-[#0757d8]">{worker.user.profilePhotoUrl ? <img src={worker.user.profilePhotoUrl} alt={name} className="h-full w-full object-cover" /> : <UserRound size={30} />}</div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-bold text-slate-900">{name}</h1><span className="text-xs font-semibold text-slate-400">{worker.workerCode}</span></div>
              <p className="mt-1 text-sm font-medium text-[#0757d8]">{worker.profession || worker.professionCategory || "Profession not provided"}</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500"><span>{worker.experienceYears != null ? `${worker.experienceYears} years experience` : "Experience not provided"}</span>{currentAddress && <span className="inline-flex items-center gap-1"><MapPin size={13} />{[currentAddress.city, currentAddress.district, currentAddress.state].filter(Boolean).join(", ")}</span>}<span>Profile {worker.profileCompletion}% complete</span></div>
              {worker.bio && <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">{worker.bio}</p>}
              <div className="mt-4 flex flex-wrap gap-2"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${verificationClass(worker.verificationStatus)}`}><ShieldCheck size={12} className="mr-1 inline" />{pretty(worker.verificationStatus)}{worker.verificationScore != null && ` · ${worker.verificationScore}%`}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">{pretty(worker.availabilityStatus)}</span></div>
            </div>
          </div>
          <div className="mt-5 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-2"><ContactItem icon={<Phone size={15} />} label="Phone" value={worker.user.phone || "Not provided"} /><ContactItem icon={<Mail size={15} />} label="Email" value={worker.user.email || "Not provided"} /></div>
        </section>

        <Section title="Skills & job match" icon={<Award size={18} />}>
          <div className="mb-4 flex flex-wrap gap-2">{worker.skills.length ? worker.skills.map((item) => <span key={item.skill?.name} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">{item.skill?.name}{item.skillLevel ? ` · ${pretty(item.skillLevel)}` : ""}{item.verified ? " · Verified" : ""}</span>) : <p className="text-sm text-slate-500">No skills listed.</p>}</div>
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4"><div className="text-xs font-bold uppercase tracking-wide text-blue-700">Applied job</div><div className="mt-1 text-base font-bold text-slate-900">{data.job.title}</div><div className="mt-2 flex flex-wrap gap-2">{jobSkills.map((skill) => <span key={skill} className={`rounded-md px-2 py-1 text-[11px] font-semibold ${matchingSkills.includes(skill) ? "bg-emerald-100 text-emerald-700" : "bg-white text-slate-500"}`}>{skill}{matchingSkills.includes(skill) ? " ✓" : ""}</span>)}</div><p className="mt-3 text-xs text-slate-600">{matchingSkills.length} of {jobSkills.length} required skills matched.</p></div>
        </Section>

        <Section title="Employment history" icon={<BriefcaseBusiness size={18} />}>
          {worker.employmentHistory.length === 0 ? <EmptyText text="No employment history provided." /> : <div className="space-y-4">{worker.employmentHistory.map((item) => <div key={item.id} className="rounded-lg border border-slate-200 p-4"><div className="flex flex-col justify-between gap-2 sm:flex-row"><div><h3 className="text-sm font-bold text-slate-900">{item.designation}</h3><p className="mt-0.5 text-sm font-semibold text-slate-600">{item.companyName}</p></div><span className={`h-fit rounded-full px-2.5 py-1 text-[10px] font-bold ${verificationClass(item.verificationStatus)}`}>{pretty(item.verificationStatus)}</span></div><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"><span>{formatDate(item.startDate)} – {formatDate(item.endDate)}</span>{item.employmentType && <span>{pretty(item.employmentType)}</span>}{item.companyAddress && <span>{item.companyAddress}</span>}</div>{item.references.length > 0 && <div className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500"><span className="font-semibold text-slate-700">References:</span> {item.references.map((ref) => `${ref.name}${ref.designation ? ` (${ref.designation})` : ""} · ${pretty(ref.verificationStatus)}`).join("; ")}</div>}</div>)}</div>}
        </Section>

        <Section title="Education & certifications" icon={<GraduationCap size={18} />}>
          <div className="grid gap-4 md:grid-cols-2"><div><h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Education</h3><div className="mt-3 space-y-3">{worker.education.length ? worker.education.map((item) => <div key={item.id} className="rounded-lg border border-slate-200 p-3"><div className="text-sm font-bold text-slate-800">{item.qualification}</div><div className="mt-1 text-xs text-slate-500">{[item.institution, item.fieldOfStudy].filter(Boolean).join(" · ") || "Details not provided"}</div><div className="mt-2 text-[11px] text-slate-400">{item.startYear || ""}{item.startYear && item.endYear ? " – " : ""}{item.endYear || ""}{item.verified ? " · Verified" : ""}</div></div>) : <EmptyText text="No education records." />}</div></div><div><h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Certifications</h3><div className="mt-3 space-y-3">{worker.certifications.length ? worker.certifications.map((item) => <div key={item.id} className="rounded-lg border border-slate-200 p-3"><div className="text-sm font-bold text-slate-800">{item.name}</div><div className="mt-1 text-xs text-slate-500">{item.issuingBody || "Issuing body not provided"}</div><div className="mt-2 text-[11px] text-slate-400">{item.certificateNo || "No certificate number"}{item.verified ? " · Verified" : ""}</div></div>) : <EmptyText text="No certifications." />}</div></div></div>
        </Section>

        <Section title="Documents & verification" icon={<FileText size={18} />}>
          <div className="space-y-3">{worker.documents.length ? worker.documents.map((doc) => <div key={doc.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100"><FileText size={16} className="text-slate-600" /></div><div className="min-w-0"><div className="truncate text-sm font-semibold text-slate-800">{doc.fileName}</div><div className="mt-1 text-[11px] text-slate-500">{pretty(doc.type)} · {doc.documentNumber || "Number not provided"}</div></div></div><span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-bold ${verificationClass(doc.verificationStatus)}`}>{pretty(doc.verificationStatus)}</span></div>) : <EmptyText text="No documents uploaded." />}</div>
        </Section>
      </div>

      <aside className="space-y-5">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-base font-bold text-slate-900">Hiring decision</h2><p className="mt-1 text-xs leading-5 text-slate-500">Review the profile and verification information before making a decision.</p><div className="mt-4 rounded-lg bg-slate-50 p-4"><div className="text-xs text-slate-500">Application status</div><div className="mt-1 text-lg font-extrabold text-slate-900">{pretty(data.status)}</div><div className="mt-2 text-[11px] text-slate-400">Applied {formatDate(data.appliedAt)}</div></div>{data.status === "APPLIED" && <div className="mt-4 grid gap-2"><button disabled={updating} onClick={() => void updateStatus("shortlist")} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0757d8] px-4 py-3 text-sm font-bold text-white hover:bg-[#0649b8] disabled:opacity-50"><CheckCircle2 size={16} /> Shortlist worker</button><button disabled={updating} onClick={() => void updateStatus("reject")} className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"><XCircle size={16} /> Reject application</button></div>}{data.status === "SHORTLISTED" && <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-700"><CheckCircle2 size={15} className="mr-1 inline" /> This worker is shortlisted.</div>}{data.status === "REJECTED" && <div className="mt-4 rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700"><XCircle size={15} className="mr-1 inline" /> This application was rejected.</div>}</section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h2 className="text-base font-bold text-slate-900">Background verification</h2><ShieldCheck size={18} className="text-[#0757d8]" /></div>{latestVerification ? <><div className="mt-4 flex items-end justify-between"><div><div className="text-xs text-slate-500">Overall status</div><div className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${verificationClass(latestVerification.status)}`}>{pretty(latestVerification.status)}</div></div>{latestVerification.overallScore != null && <div className="text-right"><div className="text-2xl font-extrabold text-slate-900">{latestVerification.overallScore}%</div><div className="text-[10px] text-slate-400">Verification score</div></div>}</div><div className="mt-4 space-y-2">{verificationChecks.map((check) => <div key={check.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2.5"><div className="min-w-0"><div className="truncate text-xs font-semibold text-slate-700">{pretty(check.type)}</div>{check.result?.remarks && <div className="mt-0.5 truncate text-[10px] text-slate-400">{check.result.remarks}</div>}</div><div className="text-right"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${verificationClass(check.status)}`}>{pretty(check.status)}</span>{check.result?.score != null && <div className="mt-1 text-[10px] text-slate-400">{check.result.score}%</div>}</div></div>)}</div><div className="mt-3 text-[10px] text-slate-400">{verificationDone}/{verificationChecks.length} checks completed · Updated {formatDate(latestVerification.completedAt || latestVerification.createdAt)}</div></> : <EmptyText text="No background verification request found." />}</section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-base font-bold text-slate-900">Applied job</h2><Link href={`/employer/jobs/${data.job.id}`} className="mt-2 block text-sm font-bold text-[#0757d8] hover:underline">{data.job.title}</Link><div className="mt-3 space-y-2 text-xs text-slate-500"><div className="flex gap-2"><MapPin size={14} />{[data.job.city, data.job.district, data.job.state].filter(Boolean).join(", ")}</div><div className="flex gap-2"><CalendarDays size={14} />Start {formatDate(data.job.startDate)}</div><div className="flex gap-2"><BriefcaseBusiness size={14} />{formatSalary(data.job.salaryMin, data.job.salaryMax)} · {pretty(data.job.salaryType)}</div></div></section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-base font-bold text-slate-900">Languages</h2><div className="mt-3 flex flex-wrap gap-2">{worker.languages.length ? worker.languages.map((item) => <span key={item.language?.name} className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600"><Languages size={12} />{item.language?.name} · {pretty(item.proficiency)}</span>) : <EmptyText text="No languages listed." />}</div></section>
      </aside>
    </div>
  </EmployerShell>;
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) { return <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-2 text-slate-900"><span className="text-[#0757d8]">{icon}</span><h2 className="text-base font-bold">{title}</h2></div>{children}</section>; }
function ContactItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3"><span className="text-[#0757d8]">{icon}</span><div><div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</div><div className="mt-0.5 text-xs font-semibold text-slate-700">{value}</div></div></div>; }
function EmptyText({ text }: { text: string }) { return <p className="text-sm text-slate-500">{text}</p>; }
