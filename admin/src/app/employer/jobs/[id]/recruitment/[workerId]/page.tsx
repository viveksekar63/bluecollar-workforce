"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  Send,
  Sparkles,
  UserRound,
} from "lucide-react";
import { EmployerShell } from "@/components/layout/employer-shell";

type Outreach = {
  outreachId?: string;
  workerId: string;
  status: string;
  preferredChannel?: string | null;
  lastChannel?: string | null;
  contactAttempts?: number;
  lastContactedAt?: string | null;
  nextFollowUpAt?: string | null;
  outcome?: string | null;
  notes?: string | null;
  workerCode?: string;
  profession?: string;
  professionCategory?: string;
  experienceYears?: number | null;
  verificationStatus?: string | null;
  verificationScore?: number | null;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  email?: string | null;
  profilePhotoUrl?: string | null;
  matchScore?: number;
  matchTier?: string;
  conversionScore?: number;
  conversionBand?: string;
  priorityScore?: number;
  reasons?: string[];
};

type TimelineEvent = {
  id: string;
  channel?: string | null;
  eventType: string;
  outcome?: string | null;
  notes?: string | null;
  createdAt: string;
};

type TimelineResponse = { success: boolean; outreach?: Outreach | null; events: TimelineEvent[] };

const base = (jobId: string, workerId: string) => `/api/backend/jobs/${jobId}/workers/${workerId}/outreach`;
const listApi = (jobId: string) => `/api/backend/jobs/${jobId}/outreach?limit=50&page=1`;

const statuses = [
  "CONTACTED",
  "NO_RESPONSE",
  "INTERESTED",
  "INTERVIEW",
  "SELECTED",
  "HIRED",
  "NOT_INTERESTED",
  "UNAVAILABLE",
  "WRONG_NUMBER",
] as const;

const channels = ["PHONE", "WHATSAPP", "SMS", "EMAIL"] as const;

function nameOf(c?: Outreach | null) {
  return [c?.firstName, c?.lastName].filter(Boolean).join(" ") || c?.workerCode || "Worker";
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function statusClass(status?: string) {
  if (["INTERESTED", "INTERVIEW", "SELECTED", "HIRED"].includes(status ?? "")) return "bg-emerald-50 text-emerald-700";
  if (["NO_RESPONSE", "UNAVAILABLE"].includes(status ?? "")) return "bg-amber-50 text-amber-700";
  if (["NOT_INTERESTED", "WRONG_NUMBER"].includes(status ?? "")) return "bg-red-50 text-red-700";
  return "bg-blue-50 text-blue-700";
}

export default function RecruitmentWorkspacePage({ params }: { params: Promise<{ id: string; workerId: string }> }) {
  const [jobId, setJobId] = useState("");
  const [workerId, setWorkerId] = useState("");
  const [candidate, setCandidate] = useState<Outreach | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showContact, setShowContact] = useState(false);
  const [channel, setChannel] = useState<(typeof channels)[number]>("PHONE");
  const [status, setStatus] = useState("CONTACTED");
  const [outcome, setOutcome] = useState("");
  const [notes, setNotes] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [statusValue, setStatusValue] = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const [statusOutcome, setStatusOutcome] = useState("");
  const [followUpValue, setFollowUpValue] = useState("");
  const [followUpNotes, setFollowUpNotes] = useState("");

  async function request(url: string, init?: RequestInit) {
    const response = await fetch(url, { ...init, credentials: "include", cache: "no-store", headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.message || "Request failed");
    return data;
  }

  async function load(job: string, worker: string) {
    setLoading(true);
    setError(null);
    try {
      const [list, timeline] = await Promise.all([
        request(listApi(job)),
        request(`${base(job, worker)}/timeline`),
      ]);
      const item = (list?.items ?? []).find((row: Outreach) => row.workerId === worker);
      if (!item) throw new Error("Recruitment candidate not found in this job shortlist");
      setCandidate({ ...item, ...(timeline?.outreach ?? {}) });
      setEvents(timeline?.events ?? []);
      setStatusValue(timeline?.outreach?.status ?? item.status ?? "CONTACTED");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load recruitment workspace");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void (async () => {
      const resolved = await params;
      setJobId(resolved.id);
      setWorkerId(resolved.workerId);
      await load(resolved.id, resolved.workerId);
    })();
  }, [params]);

  const fullName = nameOf(candidate);
  const terminal = useMemo(() => ["HIRED", "NOT_INTERESTED", "WRONG_NUMBER"].includes(candidate?.status ?? ""), [candidate?.status]);

  async function logContact() {
    if (!jobId || !workerId) return;
    setSaving(true); setError(null); setMessage(null);
    try {
      await request(`${base(jobId, workerId)}/contact`, { method: "POST", body: JSON.stringify({ channel, status, outcome: outcome || undefined, notes: notes || undefined, nextFollowUpAt: followUp ? new Date(followUp).toISOString() : null }) });
      setShowContact(false); setOutcome(""); setNotes(""); setFollowUp("");
      setMessage("Contact attempt logged successfully.");
      await load(jobId, workerId);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to log contact"); } finally { setSaving(false); }
  }

  async function updateStatus() {
    if (!statusValue) return;
    setSaving(true); setError(null); setMessage(null);
    try {
      await request(`${base(jobId, workerId)}/status`, { method: "PATCH", body: JSON.stringify({ status: statusValue, outcome: statusOutcome || undefined, notes: statusNotes || undefined }) });
      setStatusOutcome(""); setStatusNotes(""); setMessage("Recruitment status updated.");
      await load(jobId, workerId);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to update status"); } finally { setSaving(false); }
  }

  async function scheduleFollowUp() {
    if (!followUpValue) return;
    setSaving(true); setError(null); setMessage(null);
    try {
      await request(`${base(jobId, workerId)}/follow-up`, { method: "POST", body: JSON.stringify({ nextFollowUpAt: new Date(followUpValue).toISOString(), notes: followUpNotes || undefined }) });
      setFollowUpValue(""); setFollowUpNotes(""); setMessage("Follow-up scheduled.");
      await load(jobId, workerId);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to schedule follow-up"); } finally { setSaving(false); }
  }

  return <EmployerShell>
    <div className="mb-5 flex items-center justify-between gap-3">
      <div className="flex items-start gap-3"><Link href={jobId ? `/employer/jobs/${jobId}/ai-recruiter` : "/employer/jobs"} className="mt-1 rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"><ArrowLeft size={17} /></Link><div><div className="flex items-center gap-2"><Sparkles size={18} className="text-blue-600" /><h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Recruitment Workspace</h1></div><p className="mt-1 text-xs text-slate-500">Contact, qualify and move this candidate through your recruitment pipeline.</p></div></div>
      <button type="button" disabled={loading || saving} onClick={() => void load(jobId, workerId)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh</button>
    </div>

    {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    {message && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
    {loading && <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">Loading candidate workspace...</div>}

    {!loading && candidate && <>
      <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4"><div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 text-xl font-extrabold">{candidate.profilePhotoUrl ? <img src={candidate.profilePhotoUrl} alt="" className="h-16 w-16 rounded-2xl object-cover" /> : <UserRound size={25} />}</div><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-extrabold text-slate-900">{fullName}</h2><span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{candidate.workerCode}</span><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusClass(candidate.status)}`}>{candidate.status.replaceAll("_", " ")}</span></div><p className="mt-1 text-sm text-slate-500">{candidate.profession || "Worker"}{candidate.experienceYears != null ? ` · ${candidate.experienceYears} years experience` : ""}</p><div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="rounded-lg bg-blue-50 px-3 py-1.5 font-bold text-blue-700">{candidate.matchScore ?? 0}% AI match</span><span className="rounded-lg bg-violet-50 px-3 py-1.5 font-bold text-violet-700">{candidate.conversionScore ?? 0}% conversion</span><span className="rounded-lg bg-slate-100 px-3 py-1.5 font-semibold text-slate-600">Verification {candidate.verificationScore ?? 0}</span></div></div></div>
          <div className="flex flex-wrap gap-2">{candidate.phone && <a href={`tel:${candidate.phone}`} className="inline-flex items-center gap-2 rounded-lg bg-[#0757d8] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#064dbf]"><Phone size={15} /> Call</a>}{candidate.phone && <a href={`https://wa.me/${candidate.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100"><MessageCircle size={15} /> WhatsApp</a>}{candidate.email && <a href={`mailto:${candidate.email}`} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"><Mail size={15} /> Email</a>}<button type="button" disabled={terminal} onClick={() => setShowContact(true)} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-50"><Send size={15} /> Log contact</button></div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-sm font-bold text-slate-900">AI recommendation</h2><p className="mt-1 text-xs text-slate-500">Why this candidate is prioritized.</p></div><Sparkles size={18} className="text-blue-600" /></div><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-blue-50 p-4"><div className="text-[11px] font-semibold text-blue-600">Match</div><div className="mt-1 text-2xl font-extrabold text-blue-800">{candidate.matchScore ?? 0}%</div><div className="text-[11px] font-bold text-blue-600">{candidate.matchTier ?? "—"}</div></div><div className="rounded-xl bg-violet-50 p-4"><div className="text-[11px] font-semibold text-violet-600">Conversion</div><div className="mt-1 text-2xl font-extrabold text-violet-800">{candidate.conversionScore ?? 0}%</div><div className="text-[11px] font-bold text-violet-600">{candidate.conversionBand ?? "—"}</div></div><div className="rounded-xl bg-slate-50 p-4"><div className="text-[11px] font-semibold text-slate-500">Attempts</div><div className="mt-1 text-2xl font-extrabold text-slate-900">{candidate.contactAttempts ?? 0}</div><div className="text-[11px] font-semibold text-slate-500">contact attempts</div></div></div>{candidate.reasons?.length ? <div className="mt-4 space-y-2">{candidate.reasons.slice(0, 4).map((reason) => <div key={reason} className="flex gap-2 text-xs text-slate-600"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-600" />{reason}</div>)}</div> : null}</section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-2"><CalendarClock size={17} className="text-blue-600" /><div><h2 className="text-sm font-bold text-slate-900">Recruitment status</h2><p className="mt-1 text-xs text-slate-500">Move the candidate to the next stage.</p></div></div><div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"><select value={statusValue} onChange={(e) => setStatusValue(e.target.value)} disabled={saving} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700"><option value="">Select status</option>{statuses.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select><input value={statusOutcome} onChange={(e) => setStatusOutcome(e.target.value)} maxLength={100} placeholder="Outcome (optional)" className="rounded-lg border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-blue-400" /><button type="button" disabled={saving || terminal} onClick={() => void updateStatus()} className="rounded-lg bg-[#0757d8] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">Update</button></div><textarea value={statusNotes} onChange={(e) => setStatusNotes(e.target.value)} maxLength={2000} placeholder="Notes (optional)" className="mt-3 min-h-20 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-blue-400" /></section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-2"><Clock3 size={17} className="text-blue-600" /><div><h2 className="text-sm font-bold text-slate-900">Schedule follow-up</h2><p className="mt-1 text-xs text-slate-500">Never lose a promising candidate because of a missed callback.</p></div></div><div className="grid gap-3 sm:grid-cols-[1fr_auto]"><input type="datetime-local" value={followUpValue} onChange={(e) => setFollowUpValue(e.target.value)} disabled={terminal || saving} className="rounded-lg border border-slate-200 px-3 py-2.5 text-xs" /><button type="button" disabled={!followUpValue || terminal || saving} onClick={() => void scheduleFollowUp()} className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 disabled:opacity-50"><CalendarClock size={14} /> Schedule</button></div><textarea value={followUpNotes} onChange={(e) => setFollowUpNotes(e.target.value)} maxLength={2000} placeholder="Follow-up note (optional)" className="mt-3 min-h-20 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs" /></section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-bold text-slate-900">Contact details</h2><div className="mt-4 space-y-3 text-xs"><div><div className="text-slate-400">Phone</div><div className="mt-1 font-semibold text-slate-800">{candidate.phone || "Not available"}</div></div><div><div className="text-slate-400">Email</div><div className="mt-1 break-all font-semibold text-slate-800">{candidate.email || "Not available"}</div></div><div><div className="text-slate-400">Last contacted</div><div className="mt-1 font-semibold text-slate-800">{formatDate(candidate.lastContactedAt)}</div></div><div><div className="text-slate-400">Next follow-up</div><div className="mt-1 font-semibold text-slate-800">{formatDate(candidate.nextFollowUpAt)}</div></div><div><div className="text-slate-400">Last channel</div><div className="mt-1 font-semibold text-slate-800">{candidate.lastChannel || "—"}</div></div></div></section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-bold text-slate-900">Recruitment timeline</h2><div className="mt-4 space-y-4">{events.length ? events.map((event) => <div key={event.id} className="relative pl-6"><span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-blue-600" /><div className="text-xs font-bold text-slate-800">{event.eventType.replaceAll("_", " ")}</div><div className="mt-0.5 text-[11px] text-slate-400">{formatDate(event.createdAt)}{event.channel ? ` · ${event.channel}` : ""}</div>{event.outcome && <div className="mt-1 text-xs font-semibold text-slate-600">{event.outcome}</div>}{event.notes && <div className="mt-1 text-xs text-slate-500">{event.notes}</div>}</div>) : <div className="py-6 text-center text-xs text-slate-500">No recruitment activity yet.</div>}</div></section>
        </aside>
      </div>
    </>}

    {showContact && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"><div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl"><div className="flex items-center justify-between"><div><h2 className="text-lg font-extrabold text-slate-900">Log contact attempt</h2><p className="mt-1 text-xs text-slate-500">Record what happened with {fullName}.</p></div><button type="button" onClick={() => setShowContact(false)} className="text-sm font-bold text-slate-400 hover:text-slate-700">✕</button></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-slate-600">Channel<select value={channel} onChange={(e) => setChannel(e.target.value as (typeof channels)[number])} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs">{channels.map((item) => <option key={item}>{item}</option>)}</select></label><label className="text-xs font-semibold text-slate-600">Resulting status<select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs"><option>CONTACTED</option>{statuses.filter((item) => item !== "CONTACTED").map((item) => <option key={item}>{item}</option>)}</select></label></div><label className="mt-3 block text-xs font-semibold text-slate-600">Outcome<input value={outcome} onChange={(e) => setOutcome(e.target.value)} maxLength={100} placeholder="e.g. Interested in interview" className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs" /></label><label className="mt-3 block text-xs font-semibold text-slate-600">Next follow-up (optional)<input type="datetime-local" value={followUp} onChange={(e) => setFollowUp(e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs" /></label><label className="mt-3 block text-xs font-semibold text-slate-600">Notes<textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} rows={4} placeholder="What did the worker say?" className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs" /></label><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setShowContact(false)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700">Cancel</button><button type="button" disabled={saving} onClick={() => void logContact()} className="inline-flex items-center gap-2 rounded-lg bg-[#0757d8] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"><Send size={14} /> {saving ? "Saving..." : "Log contact"}</button></div></div></div>}
  </EmployerShell>;
}
