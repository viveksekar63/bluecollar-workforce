"use client";

import { useWorker } from "@/hooks/use-workers";
import { CalendarDays, FileCheck2, Mail, MapPin, Phone, ShieldCheck, Loader2 } from "lucide-react";

function statusClass(status: string) {
  if (status === "VERIFIED") return "text-emerald-600";
  if (status === "REJECTED") return "text-red-600";
  return "text-amber-600";
}

export function WorkerProfileLive({ id }: { id: string }) {
  const query = useWorker(id);

  if (query.isLoading) return <div className="card flex min-h-[500px] items-center justify-center gap-2 text-sm text-slate-500"><Loader2 className="animate-spin" size={18}/> Loading worker profile...</div>;
  if (query.isError || !query.data) return <div className="card p-8 text-sm text-red-600">Unable to load this worker.</div>;

  const w = query.data;

  return (
    <div className="card overflow-hidden">
      <div className="bg-gradient-to-r from-[#062c6f] to-[#0757d8] p-6 text-white">
        <div className="flex flex-wrap items-center gap-5">
          <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-white/40 bg-slate-200 text-center text-2xl font-bold leading-[72px] text-slate-700">
            {w.firstName[0]}{w.lastName?.[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{w.firstName} {w.lastName}</h1>
              <span className="rounded-full bg-white/15 px-2 py-1 text-[10px] font-bold">
                {w.verificationStatus === "VERIFIED" ? "✓ Verified" : w.verificationStatus.replace("_", " ")}
              </span>
            </div>
            <p className="mt-1 text-sm text-blue-100">{w.primarySkill} • {w.experienceYears} Years Experience • Worker ID: {w.workerCode}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-blue-100">
              <span className="flex items-center gap-1"><MapPin size={13}/>{w.city}, {w.state}</span>
              <span className="flex items-center gap-1"><Phone size={13}/>{w.phone}</span>
              {w.email && <span className="flex items-center gap-1"><Mail size={13}/>{w.email}</span>}
            </div>
          </div>
          <div className="rounded-xl bg-white/10 p-4 text-center">
            <div className="text-[10px] text-blue-100">Verification Score</div>
            <div className="text-3xl font-extrabold">{w.verificationScore}<span className="text-sm">/100</span></div>
            <div className="text-xs text-emerald-200">{w.verificationScore >= 90 ? "Highly Verified" : "Verification in progress"}</div>
          </div>
        </div>
      </div>

      <div className="flex overflow-x-auto border-b px-5">
        {["Overview","Documents","Employment","Skills","Verification","References","Education","Activity"].map((x,i)=>
          <button key={x} className={`whitespace-nowrap px-5 py-4 text-xs font-semibold ${i===0?"border-b-2 border-blue-600 text-blue-600":"text-slate-500"}`}>{x}</button>
        )}
      </div>

      <div className="grid gap-5 p-6 xl:grid-cols-[1.25fr_.75fr]">
        <div className="space-y-5">
          <section>
            <h2 className="mb-3 text-sm font-bold">About Worker</h2>
            <div className="card p-5">
              <p className="text-xs leading-6 text-slate-600">{w.about || "No worker description has been added yet."}</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {[
                  ["Date of Birth", w.dateOfBirth || "Not provided", CalendarDays],
                  ["Phone", w.phone, Phone],
                  ["Email", w.email || "Not provided", Mail],
                  ["Languages", w.languages?.join(", ") || "Not provided", FileCheck2]
                ].map(([a,b,I]) => (
                  <div key={String(a)}>
                    <div className="mb-1 flex items-center gap-2 text-[10px] text-slate-400"><I size={13}/>{String(a)}</div>
                    <div className="text-xs font-semibold">{String(b)}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-bold">Employment History</h2>
            <div className="space-y-3">
              {(w.employmentHistory || []).length === 0 && <div className="card p-5 text-xs text-slate-500">No employment history recorded.</div>}
              {(w.employmentHistory || []).map(e => (
                <div className="card p-5" key={e.id}>
                  <div className="flex items-start justify-between">
                    <div>
                      <b className="text-sm">{e.companyName}</b>
                      <div className="mt-1 text-xs text-slate-500">{e.designation} • {e.startDate} – {e.currentlyWorking ? "Present" : e.endDate || "N/A"}</div>
                    </div>
                    <span className={`text-[10px] font-bold ${statusClass(e.verificationStatus)}`}>{e.verificationStatus.replace("_", " ")}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
                    <div><span className="text-slate-400">Supervisor</span><div className="font-semibold">{e.supervisorName || "Not provided"}</div></div>
                    <div><span className="text-slate-400">Employment Check</span><div className={`font-semibold ${statusClass(e.verificationStatus)}`}>{e.verificationStatus.replace("_", " ")}</div></div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div>
          <section className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold">Verification Status</h2>
              <ShieldCheck className="text-blue-600" size={20}/>
            </div>
            <div className="space-y-1">
              {(w.verifications || []).map(v => (
                <div key={v.id} className="flex items-center gap-3 border-b py-4 last:border-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><FileCheck2 size={15}/></div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold">{v.label}</div>
                    <div className="text-[10px] text-slate-400">{v.description}</div>
                  </div>
                  <span className={`text-[10px] font-bold ${statusClass(v.status)}`}>{v.status.replace("_", " ")} {v.status==="VERIFIED"?"✓":"◷"}</span>
                </div>
              ))}
              {(w.verifications || []).length === 0 && <div className="py-6 text-center text-xs text-slate-500">No verification checks recorded.</div>}
            </div>
          </section>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="card p-4"><div className="text-[10px] text-slate-400">Skills</div><b className="mt-1 block text-lg">{w.primarySkill ? 1 : 0}</b></div>
            <div className="card p-4"><div className="text-[10px] text-slate-400">Documents</div><b className="mt-1 block text-lg">{w.documents?.length || 0}</b></div>
          </div>
        </div>
      </div>
    </div>
  );
}
