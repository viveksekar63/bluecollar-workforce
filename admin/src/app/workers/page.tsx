import Link from "next/link";
import { Download, FileUp } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";
import { WorkerListLive } from "@/components/workers/worker-list-live";

export default function WorkersPage() {
  return (
    <AdminShell>
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-[24px] font-bold">Worker Master</h1>
          <p className="mt-1 text-xs text-slate-500">Manage the workforce supplied to employers, including verification and availability.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/api/backend/admin/workers/import/template" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            <Download size={14} /> CSV Template
          </a>
          <Link href="/workers/import" className="inline-flex items-center gap-2 rounded-lg bg-[#0757d8] px-4 py-2 text-xs font-bold text-white hover:bg-blue-700">
            <FileUp size={14} /> Import Workers
          </Link>
        </div>
      </div>
      <WorkerListLive />
    </AdminShell>
  );
}
