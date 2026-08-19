import { AdminShell } from "@/components/layout/admin-shell";
import { WorkerListLive } from "@/components/workers/worker-list-live";

export default function WorkersPage() {
  return (
    <AdminShell>
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h1 className="text-[24px] font-bold">Workers</h1>
          <p className="mt-1 text-xs text-slate-500">Manage registered, verified and available workers.</p>
        </div>
        <div className="rounded-lg bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">Verified workforce</div>
      </div>
      <WorkerListLive />
    </AdminShell>
  );
}
