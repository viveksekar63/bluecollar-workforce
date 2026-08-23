"use client";

import Link from "next/link";
import { Search, SlidersHorizontal, MoreHorizontal, Loader2 } from "lucide-react";
import { useState } from "react";
import { useWorkers } from "@/hooks/use-workers";

function verificationBadge(status: string) {
  switch (status) {
    case "VERIFIED":
      return "bg-emerald-50 text-emerald-700";
    case "PENDING":
      return "bg-amber-50 text-amber-700";
    case "FAILED":
      return "bg-red-50 text-red-700";
    case "MANUAL_REVIEW":
      return "bg-violet-50 text-violet-700";
    case "EXPIRED":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-blue-50 text-blue-700";
  }
}

export function WorkerListLive() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const query = useWorkers({
    page,
    limit: 20,
    search,
    verificationStatus: status,
  });

  const rows = query.data?.items || [];

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b p-4">
        <div className="flex min-w-[280px] flex-1 items-center gap-2 rounded-lg border px-3 py-2">
          <Search size={15} className="text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full text-xs outline-none"
            placeholder="Search worker, ID, skill, location..."
          />
        </div>

        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-lg border px-3 py-2 text-xs"
        >
          <option value="">Verification</option>
          <option value="VERIFIED">Verified</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="PENDING">Pending</option>
          <option value="MANUAL_REVIEW">Manual Review</option>
          <option value="FAILED">Failed</option>
          <option value="EXPIRED">Expired</option>
        </select>

        <button className="flex items-center gap-1 rounded-lg border px-3 py-2 text-xs">
          <SlidersHorizontal size={13} /> More Filters
        </button>

        <Link href="/workers/new" className="rounded-lg bg-[#0757d8] px-4 py-2 text-xs font-bold text-white">
          + Add Worker
        </Link>
      </div>

      {query.isLoading ? (
        <div className="flex h-72 items-center justify-center gap-2 text-sm text-slate-500">
          <Loader2 className="animate-spin" size={18} /> Loading workers...
        </div>
      ) : query.isError ? (
        <div className="m-5 rounded-lg bg-red-50 p-4 text-xs text-red-700">
          Unable to load workers. {query.error instanceof Error ? query.error.message : "Please try again."}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] text-slate-500">
              <tr>
                <th className="px-5 py-3">Worker</th>
                <th>Skill</th>
                <th>Location</th>
                <th>Experience</th>
                <th>Verification</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    No workers found.
                  </td>
                </tr>
              ) : (
                rows.map((worker) => (
                  <tr key={worker.id} className="border-t hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <Link href={`/workers/${worker.id}`} className="flex items-center gap-3">
                        <div className="h-9 w-9 overflow-hidden rounded-full bg-slate-200 text-center leading-9 font-bold">
                          {worker.firstName[0]}{worker.lastName?.[0]}
                        </div>
                        <div>
                          <b>{worker.firstName} {worker.lastName}</b>
                          <div className="text-[10px] text-slate-400">{worker.workerCode}</div>
                        </div>
                      </Link>
                    </td>
                    <td>{worker.primarySkill}</td>
                    <td>{worker.city}, {worker.state}</td>
                    <td>{worker.experienceYears} Years</td>
                    <td><b>{worker.verificationScore}%</b></td>
                    <td>
                      <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${verificationBadge(worker.verificationStatus)}`}>
                        {worker.verificationStatus.replace("_", " ")}
                      </span>
                    </td>
                    <td><MoreHorizontal size={17} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between border-t p-4 text-xs text-slate-500">
        <span>
          {query.data ? `Showing ${rows.length} of ${query.data.total} workers` : "Loading..."}
        </span>
        <div className="flex gap-1">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded border px-3 py-1 disabled:opacity-40"
          >Previous</button>
          <span className="rounded bg-blue-600 px-3 py-1 text-white">{page}</span>
          <button
            disabled={!query.data || page >= query.data.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border px-3 py-1 disabled:opacity-40"
          >Next</button>
        </div>
      </div>
    </div>
  );
}
