"use client";

import Link from "next/link";
import { Search, SlidersHorizontal, MoreHorizontal } from "lucide-react";
import { useState } from "react";

const data = [
  ["Ravi Kumar","BCW-000124","Mason","Thanjavur","7 Years","95%","Verified","Available"],
  ["Suresh Babu","BCW-000125","Carpenter","Kumbakonam","5 Years","90%","Verified","Working"],
  ["Mohammed Ali","BCW-000126","Plumber","Chennai","6 Years","85%","In Progress","Available"],
  ["Gopal Singh","BCW-000127","Electrician","Coimbatore","4 Years","75%","In Progress","Working"],
  ["Kumar Raj","BCW-000128","Painter","Madurai","3 Years","70%","Pending","Available"],
];

export function WorkerTable() {
  const [q,setQ] = useState("");
  const rows = data.filter(r => r.join(" ").toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b p-4">
        <div className="flex min-w-[260px] flex-1 items-center gap-2 rounded-lg border px-3 py-2">
          <Search size={15} className="text-slate-400"/>
          <input value={q} onChange={e=>setQ(e.target.value)} className="w-full text-xs outline-none" placeholder="Search worker, ID, skill, location..." />
        </div>
        {["Skill","Location","Verification","Status"].map(x=><button key={x} className="flex items-center gap-1 rounded-lg border px-3 py-2 text-xs"><SlidersHorizontal size={13}/>{x}</button>)}
        <button className="rounded-lg bg-[#0757d8] px-4 py-2 text-xs font-bold text-white">+ Add Worker</button>
      </div>
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 text-[10px] text-slate-500"><tr><th className="px-5 py-3">Worker</th><th>Skill</th><th>Location</th><th>Experience</th><th>Verification</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {rows.map(r=>(
            <tr key={r[1]} className="border-t hover:bg-slate-50">
              <td className="px-5 py-3"><Link href={`/workers/${r[1]}`} className="flex items-center gap-3"><div className="h-9 w-9 rounded-full bg-slate-200 text-center leading-9 font-bold">{r[0][0]}</div><div><b>{r[0]}</b><div className="text-[10px] text-slate-400">{r[1]}</div></div></Link></td>
              <td>{r[2]}</td><td>{r[3]}</td><td>{r[4]}</td>
              <td><span className="font-bold">{r[5]}</span></td>
              <td><span className={`rounded-full px-2 py-1 text-[9px] font-bold ${r[6]==="Verified"?"bg-emerald-50 text-emerald-700":r[6]==="Pending"?"bg-amber-50 text-amber-700":"bg-blue-50 text-blue-700"}`}>{r[6]}</span></td>
              <td><MoreHorizontal size={17}/></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-between border-t p-4 text-xs text-slate-500"><span>Showing {rows.length} of 25,430 workers</span><div className="flex gap-1"><button className="rounded border px-3 py-1">Previous</button><button className="rounded bg-blue-600 px-3 py-1 text-white">1</button><button className="rounded border px-3 py-1">2</button><button className="rounded border px-3 py-1">Next</button></div></div>
    </div>
  );
}
