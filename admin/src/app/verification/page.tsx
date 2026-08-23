"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  FileCheck2,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { useVerification } from "@/hooks/use-verification";
import type { VerificationStatus } from "@/types/verification";

const PAGE_SIZE = 20;

const STATUS_OPTIONS: { value: "" | VerificationStatus; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "MANUAL_REVIEW", label: "Manual Review" },
  { value: "VERIFIED", label: "Verified" },
  { value: "FAILED", label: "Failed" },
];

function formatLabel(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { className: string; icon: React.ReactNode }> = {
    PENDING: { className: "bg-amber-50 text-amber-700", icon: <Clock3 size={12} /> },
    IN_PROGRESS: { className: "bg-blue-50 text-blue-700", icon: <RefreshCw size={12} /> },
    MANUAL_REVIEW: { className: "bg-purple-50 text-purple-700", icon: <AlertCircle size={12} /> },
    VERIFIED: { className: "bg-emerald-50 text-emerald-700", icon: <CheckCircle2 size={12} /> },
    FAILED: { className: "bg-red-50 text-red-700", icon: <XCircle size={12} /> },
    EXPIRED: { className: "bg-slate-100 text-slate-600", icon: <Clock3 size={12} /> },
  };
  const item = config[status] ?? config.PENDING;
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.className}`}>{item.icon}{formatLabel(status)}</span>;
}

function getFullName(worker: { user: { firstName: string; lastName?: string | null } }) {
  return [worker.user.firstName, worker.user.lastName].filter(Boolean).join(" ");
}

export default function VerificationPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | VerificationStatus>("");
  const [page, setPage] = useState(1);
  const { requests, meta, loading, error, fetchVerification } = useVerification({ page: 1, limit: PAGE_SIZE });

  const stats = useMemo(() => {
    const visible = requests;
    return {
      total: meta.total,
      pending: visible.filter((item) => item.status === "PENDING").length,
      review: visible.filter((item) => item.status === "MANUAL_REVIEW").length,
      verified: visible.filter((item) => item.status === "VERIFIED").length,
      failed: visible.filter((item) => item.status === "FAILED").length,
    };
  }, [requests, meta.total]);

  function load(nextPage = page, nextSearch = search, nextStatus = status) {
    setPage(nextPage);
    void fetchVerification({ page: nextPage, limit: PAGE_SIZE, search: nextSearch || undefined, status: nextStatus || undefined });
  }

  function applySearch() {
    const value = searchInput.trim();
    setSearch(value);
    load(1, value, status);
  }

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setStatus("");
    load(1, "", "");
  }

  return (
    <AdminShell>
      <div className="min-h-screen bg-slate-50">
        <main className="ml-[238px] min-h-screen">
          <div className="border-b border-slate-200 bg-white">
            <div className="flex items-center justify-between px-8 py-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Background Verification</h1>
                <p className="mt-1 text-sm text-slate-500">Manage worker identity, address, employment and background checks.</p>
              </div>
              <button type="button" onClick={() => load()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
                <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
              </button>
            </div>
          </div>

          <div className="px-8 py-6">
            <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {[
                ["Total Requests", stats.total, "bg-blue-50", "text-blue-600", <FileCheck2 size={19} />],
                ["Pending", stats.pending, "bg-amber-50", "text-amber-600", <Clock3 size={19} />],
                ["Manual Review", stats.review, "bg-purple-50", "text-purple-600", <AlertCircle size={19} />],
                ["Verified", stats.verified, "bg-emerald-50", "text-emerald-600", <CheckCircle2 size={19} />],
                ["Failed", stats.failed, "bg-red-50", "text-red-600", <XCircle size={19} />],
              ].map(([label, value, bg, color, icon]) => (
                <div key={String(label)} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-900">{Number(value).toLocaleString()}</p></div>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg} ${color}`}>{icon}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                  <div className="relative flex-1">
                    <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") applySearch(); }} placeholder="Search worker, code, email or phone..." className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                  </div>
                  <select value={status} onChange={(event) => { const value = event.target.value as "" | VerificationStatus; setStatus(value); load(1, search, value); }} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none focus:border-blue-400">
                    {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  <button type="button" onClick={applySearch} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0864ec] px-4 text-xs font-semibold text-white hover:bg-blue-700"><Search size={14} /> Search</button>
                  {(search || status) && <button type="button" onClick={clearFilters} className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50">Clear</button>}
                </div>
              </div>

              {loading && requests.length === 0 ? (
                <div className="flex min-h-[360px] items-center justify-center text-sm text-slate-500"><RefreshCw size={17} className="mr-2 animate-spin" /> Loading verification requests...</div>
              ) : error ? (
                <div className="flex min-h-[360px] flex-col items-center justify-center text-center"><AlertCircle size={24} className="text-red-500" /><p className="mt-3 text-sm font-semibold text-slate-900">Unable to load verification requests</p><p className="mt-1 text-xs text-slate-500">{error}</p><button type="button" onClick={() => load()} className="mt-4 rounded-lg bg-[#0864ec] px-4 py-2 text-xs font-semibold text-white">Try Again</button></div>
              ) : requests.length === 0 ? (
                <div className="flex min-h-[360px] flex-col items-center justify-center text-center"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100"><ShieldCheck size={25} className="text-slate-400" /></div><p className="mt-4 text-sm font-semibold text-slate-900">No verification requests found</p><p className="mt-1 text-xs text-slate-500">Start a verification from a worker profile to see it here.</p></div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left">
                      <thead className="border-b border-slate-200 bg-slate-50/70">
                        <tr className="text-[11px] font-semibold uppercase tracking-wide text-slate-400"><th className="px-5 py-3">Worker</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Checks</th><th className="px-5 py-3">Score</th><th className="px-5 py-3">Created</th><th className="px-5 py-3 text-right">Action</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {requests.map((item) => {
                          const verifiedChecks = item.checks.filter((check) => check.status === "VERIFIED").length;
                          return <tr key={item.id} className="transition hover:bg-slate-50/70">
                            <td className="px-5 py-4"><div className="flex items-center gap-3">{item.worker.user.profilePhotoUrl ? <img src={item.worker.user.profilePhotoUrl} alt="" className="h-9 w-9 rounded-full object-cover" /> : <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700"><UserRound size={16} /></div>}<div><p className="text-sm font-semibold text-slate-900">{getFullName(item.worker)}</p><p className="mt-0.5 text-[11px] text-slate-400">{item.worker.workerCode} · {item.worker.user.phone}</p></div></div></td>
                            <td className="px-5 py-4"><StatusBadge status={item.status} /></td>
                            <td className="px-5 py-4"><p className="text-xs font-semibold text-slate-700">{verifiedChecks}/{item.checks.length} verified</p><div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${item.checks.length ? (verifiedChecks / item.checks.length) * 100 : 0}%` }} /></div></td>
                            <td className="px-5 py-4"><span className="text-sm font-bold text-slate-800">{item.overallScore ?? "-"}</span>{item.overallScore != null && <span className="text-[11px] text-slate-400"> / 100</span>}</td>
                            <td className="px-5 py-4 text-xs text-slate-500">{formatDate(item.createdAt)}</td>
                            <td className="px-5 py-4 text-right"><Link href={`/verification/${item.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-white"><Eye size={14} /> View</Link></td>
                          </tr>;
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3"><p className="text-[11px] text-slate-500">Showing {meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}</p><div className="flex items-center gap-2"><button type="button" disabled={meta.page <= 1 || loading} onClick={() => load(meta.page - 1)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={15} /></button><span className="text-xs font-semibold text-slate-700">Page {meta.page} of {Math.max(meta.totalPages, 1)}</span><button type="button" disabled={meta.page >= meta.totalPages || loading} onClick={() => load(meta.page + 1)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight size={15} /></button></div></div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </AdminShell>
  );
}
