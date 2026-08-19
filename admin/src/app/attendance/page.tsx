import { AdminShell } from "@/components/layout/admin-shell";

export default function Page() {
  return <AdminShell>
    <div className="mb-6"><h1 className="text-2xl font-bold">Attendance</h1><p className="mt-1 text-xs text-slate-500">Monitor worker attendance and assignments.</p></div>
    <div className="card flex min-h-[420px] items-center justify-center">
      <div className="text-center"><div className="text-lg font-bold">Attendance module</div><div className="mt-2 text-xs text-slate-500">Ready for API integration and module implementation.</div></div>
    </div>
  </AdminShell>;
}
