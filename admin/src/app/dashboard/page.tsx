import { Users, UserRoundCheck, Building2, BriefcaseBusiness, BadgeCheck, CheckCircle2, Clock3 } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { RegistrationChart, VerificationDonut } from "@/components/dashboard/charts";

const workers = [
  ["Ravi Kumar", "Mason, Brick Work", "7 Years", "95%", "Verified"],
  ["Suresh Babu", "Carpenter", "5 Years", "90%", "Verified"],
  ["Mohammed Ali", "Plumber", "6 Years", "85%", "In Progress"],
  ["Gopal Singh", "Electrician", "4 Years", "75%", "In Progress"],
];

export default function DashboardPage() {
  return (
    <AdminShell>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total Workers" value="25,430" change="+12.5%" Icon={Users} />
        <StatCard title="Verified Workers" value="18,764" change="+8.2%" Icon={BadgeCheck} tone="green" />
        <StatCard title="Total Employers" value="2,340" change="+15.3%" Icon={Building2} tone="blue" />
        <StatCard title="Active Jobs" value="1,548" change="+7.6%" Icon={BriefcaseBusiness} tone="orange" />
        <StatCard title="Jobs Completed" value="15,230" change="+10.1%" Icon={CheckCircle2} tone="purple" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_1fr]">
        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold">New Registrations</h2>
            <select className="rounded-md border px-3 py-1.5 text-xs"><option>This Month</option><option>Last Month</option></select>
          </div>
          <RegistrationChart />
          <div className="mt-1 flex justify-between text-[10px] text-slate-400"><span>1 May</span><span>8 May</span><span>15 May</span><span>22 May</span><span>29 May</span></div>
        </section>

        <section className="card p-5">
          <h2 className="mb-5 text-sm font-bold">Verification Status Overview</h2>
          <VerificationDonut />
        </section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_1fr]">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b p-5">
            <h2 className="text-sm font-bold">Recent Workers</h2>
            <a href="/workers" className="text-xs font-semibold text-blue-600">View All</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] text-slate-500">
                <tr><th className="px-5 py-3">Worker</th><th>Skills</th><th>Experience</th><th>Verification</th><th>Status</th></tr>
              </thead>
              <tbody>
                {workers.map((w,i) => (
                  <tr key={w[0]} className="border-t">
                    <td className="px-5 py-3"><div className="flex items-center gap-3"><div className="h-8 w-8 rounded-full bg-slate-200 text-center leading-8 font-bold">{w[0][0]}</div><div><b>{w[0]}</b><div className="text-[10px] text-slate-400">+91 98765 43210</div></div></div></td>
                    <td>{w[1]}</td><td>{w[2]}</td><td className="font-semibold">{w[3]}</td>
                    <td><span className={`rounded-full px-2 py-1 text-[9px] font-bold ${w[4]==="Verified"?"bg-emerald-50 text-emerald-700":"bg-blue-50 text-blue-700"}`}>{w[4]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <div className="flex items-center justify-between border-b p-5"><h2 className="text-sm font-bold">Recent Verifications</h2><a href="/verification" className="text-xs font-semibold text-blue-600">View All</a></div>
          <div className="divide-y">
            {[
              ["Ravi Kumar","Employment Verification","2 min ago","Verified"],
              ["Suresh Babu","Identity Verification","15 min ago","Verified"],
              ["Mohammed Ali","Address Verification","30 min ago","Pending"],
              ["Gopal Singh","Reference Check","1 hr ago","In Progress"],
            ].map(x => (
              <div key={x[0]} className="flex items-center gap-3 p-4">
                <div className="h-9 w-9 rounded-full bg-slate-200 text-center leading-9 text-xs font-bold">{x[0][0]}</div>
                <div className="flex-1"><b className="text-xs">{x[0]}</b><div className="text-[10px] text-slate-500">{x[1]}</div></div>
                <div className="text-right"><div className="text-[9px] text-slate-400">{x[2]}</div><span className={`text-[10px] font-semibold ${x[3]==="Verified"?"text-emerald-600":"text-amber-600"}`}>{x[3]}</span></div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
