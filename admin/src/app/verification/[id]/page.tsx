"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  FileText,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { useVerification } from "@/hooks/use-verification";
import type { VerificationRequest, VerificationStatus, WorkerDocumentEvidence } from "@/types/verification";

function label(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function dateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

function formatSize(size: number) {
  return size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700",
    IN_PROGRESS: "bg-blue-50 text-blue-700",
    MANUAL_REVIEW: "bg-purple-50 text-purple-700",
    VERIFIED: "bg-emerald-50 text-emerald-700",
    FAILED: "bg-red-50 text-red-700",
    EXPIRED: "bg-slate-100 text-slate-600",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${config[status] ?? config.PENDING}`}>{label(status)}</span>;
}

export default function VerificationDetailsPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { getVerification, updateStatus, updateCheck } = useVerification();
  const [verification, setVerification] = useState<VerificationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [openingDocument, setOpeningDocument] = useState<string | null>(null);

  async function load() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setVerification(await getVerification(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load verification");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [id]);

  async function changeStatus(status: VerificationStatus) {
    if (!verification) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await updateStatus(verification.id, { status });
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to update verification");
    } finally {
      setActionLoading(false);
    }
  }

  async function markCheck(checkId: string, status: VerificationStatus, result?: "MATCH" | "PARTIAL_MATCH" | "NO_MATCH" | "NOT_FOUND" | "MANUAL_REVIEW") {
    if (!verification) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await updateCheck(verification.id, checkId, { status, result });
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to update verification check");
    } finally {
      setActionLoading(false);
    }
  }

  async function openDocument(document: WorkerDocumentEvidence) {
    if (!verification) return;
    setOpeningDocument(document.id);
    try {
      const response = await fetch(`/api/backend/documents/worker/${verification.worker.id}/${document.id}/url`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok || !data?.url) throw new Error(data?.message ?? "Unable to open document");
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to open document");
    } finally {
      setOpeningDocument(null);
    }
  }

  return (
    <AdminShell>
      <div className="min-h-screen bg-slate-50">
        <main className="ml-[238px] min-h-screen">
          <div className="border-b border-slate-200 bg-white">
            <div className="px-8 py-5">
              <Link href="/verification" className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft size={15} /> Back to Verification</Link>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div><h1 className="text-2xl font-bold tracking-tight text-slate-900">Verification Details</h1><p className="mt-1 text-sm text-slate-500">Review worker verification checks, documents and evidence.</p></div>
                {verification && <StatusBadge status={verification.status} />}
              </div>
            </div>
          </div>

          <div className="px-8 py-6">
            {loading ? <div className="flex min-h-[500px] items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500"><RefreshCw size={17} className="mr-2 animate-spin" /> Loading verification...</div> : error ? <div className="flex min-h-[350px] flex-col items-center justify-center rounded-xl border border-red-100 bg-white text-center"><AlertCircle size={24} className="text-red-500" /><p className="mt-3 text-sm font-semibold text-slate-900">Unable to load verification</p><p className="mt-1 text-xs text-slate-500">{error}</p><button type="button" onClick={() => void load()} className="mt-4 rounded-lg bg-[#0864ec] px-4 py-2 text-xs font-semibold text-white">Try Again</button></div> : verification ? <div className="space-y-5">
              {actionError && <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-xs font-medium text-red-700"><AlertCircle size={15} /> {actionError}</div>}

              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-4">{verification.worker.user.profilePhotoUrl ? <img src={verification.worker.user.profilePhotoUrl} alt="" className="h-16 w-16 rounded-full object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600"><UserRound size={25} /></div>}<div><h2 className="text-xl font-bold text-slate-900">{verification.worker.user.firstName} {verification.worker.user.lastName ?? ""}</h2><p className="mt-1 text-xs text-slate-400">Worker Code: <span className="font-semibold text-slate-600">{verification.worker.workerCode}</span></p><div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500"><span className="inline-flex items-center gap-1"><Phone size={13} /> {verification.worker.user.phone}</span>{verification.worker.user.email && <span className="inline-flex items-center gap-1"><Mail size={13} /> {verification.worker.user.email}</span>}</div></div></div>
                  <div className="flex flex-wrap gap-2">{verification.status === "PENDING" || verification.status === "MANUAL_REVIEW" ? <button type="button" disabled={actionLoading} onClick={() => void changeStatus("IN_PROGRESS")} className="rounded-lg bg-[#0864ec] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">Start Verification</button> : null}{verification.status === "IN_PROGRESS" && <button type="button" disabled={actionLoading} onClick={() => void changeStatus("MANUAL_REVIEW")} className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-2.5 text-xs font-semibold text-purple-700 disabled:opacity-50">Send to Review</button>}</div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Overall Score</p><p className="mt-1 text-2xl font-bold text-slate-900">{verification.overallScore ?? "-"}<span className="text-xs font-medium text-slate-400">{verification.overallScore != null ? " / 100" : ""}</span></p></div>
                <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Checks</p><p className="mt-1 text-2xl font-bold text-slate-900">{verification.checks.length}</p></div>
                <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Documents</p><p className="mt-1 text-2xl font-bold text-slate-900">{verification.worker.documents?.length ?? 0}</p></div>
                <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Started</p><p className="mt-1 text-sm font-bold text-slate-900">{dateTime(verification.startedAt)}</p></div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-6 py-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50"><FileCheck2 size={18} className="text-blue-600" /></div><div><h2 className="text-sm font-bold text-slate-900">Verification Checks</h2><p className="mt-0.5 text-xs text-slate-500">Review each background verification check and its result.</p></div></div></div>
                <div className="divide-y divide-slate-100">
                  {verification.checks.map((check) => <div key={check.id} className="p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-bold text-slate-900">{label(check.type)}</h3><StatusBadge status={check.status} /></div><div className="mt-3 grid gap-4 sm:grid-cols-3"><div><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Result</p><p className="mt-1 text-xs font-semibold text-slate-700">{check.result?.result ? label(check.result.result) : "Not available"}</p></div><div><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Score</p><p className="mt-1 text-xs font-semibold text-slate-700">{check.result?.score ?? "-"}{check.result?.score != null ? " / 100" : ""}</p></div><div><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Completed</p><p className="mt-1 text-xs font-semibold text-slate-700">{dateTime(check.completedAt)}</p></div></div>{check.result?.remarks && <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600"><span className="font-semibold">Remarks:</span> {check.result.remarks}</div>}</div><div className="flex flex-wrap gap-2 lg:justify-end">{check.status !== "VERIFIED" && <button type="button" disabled={actionLoading} onClick={() => void markCheck(check.id, "VERIFIED", "MATCH")} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-semibold text-white disabled:opacity-50"><CheckCircle2 size={13} /> Verify</button>}{check.status !== "FAILED" && <button type="button" disabled={actionLoading} onClick={() => void markCheck(check.id, "FAILED", "NO_MATCH")} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700 disabled:opacity-50"><XCircle size={13} /> Fail</button>}{check.status !== "MANUAL_REVIEW" && <button type="button" disabled={actionLoading} onClick={() => void markCheck(check.id, "MANUAL_REVIEW", "MANUAL_REVIEW")} className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-[11px] font-semibold text-purple-700 disabled:opacity-50"><AlertCircle size={13} /> Review</button>}</div></div></div>)}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-6 py-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50"><FileText size={18} className="text-amber-600" /></div><div><h2 className="text-sm font-bold text-slate-900">Document Evidence</h2><p className="mt-0.5 text-xs text-slate-500">Worker documents uploaded for identity, address, skills and supporting verification.</p></div></div></div>
                <div className="divide-y divide-slate-100">
                  {(verification.worker.documents ?? []).length === 0 ? <div className="px-6 py-10 text-center text-xs text-slate-500">No documents uploaded yet.</div> : (verification.worker.documents ?? []).map((document) => <div key={document.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100"><FileText size={18} className="text-slate-500" /></div><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{document.fileName}</p><div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500"><span>{label(document.type)}</span><span>·</span><span>{formatSize(document.fileSize)}</span><span>·</span><StatusBadge status={document.verificationStatus} /></div>{document.documentNumber && <p className="mt-1 text-[11px] text-slate-400">Document no: {document.documentNumber}</p>}</div></div><button type="button" disabled={openingDocument === document.id} onClick={() => void openDocument(document)} className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">{openingDocument === document.id ? <RefreshCw size={13} className="animate-spin" /> : <ExternalLink size={13} />} View Evidence</button></div>)}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50"><ShieldCheck size={18} className="text-emerald-600" /></div><div><h2 className="text-sm font-bold text-slate-900">Verification Timeline</h2><p className="mt-0.5 text-xs text-slate-500">Request lifecycle information.</p></div></div><div className="mt-5 grid gap-5 sm:grid-cols-3"><div><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Request Created</p><p className="mt-1 text-xs font-semibold text-slate-700">{dateTime(verification.createdAt)}</p></div><div><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Started</p><p className="mt-1 text-xs font-semibold text-slate-700">{dateTime(verification.startedAt)}</p></div><div><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Completed</p><p className="mt-1 text-xs font-semibold text-slate-700">{dateTime(verification.completedAt)}</p></div></div></div>
            </div> : null}
          </div>
        </main>
      </div>
    </AdminShell>
  );
}
