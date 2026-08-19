"use client";

import { Bell, Search, Settings } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-[var(--border)] bg-white/95 px-7 backdrop-blur">
      <div>
        <h1 className="text-[22px] font-bold">Dashboard</h1>
        <p className="mt-0.5 text-xs text-[var(--muted)]">Manage your verified workforce platform</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden h-10 w-[300px] items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-3 md:flex">
          <Search size={16} className="text-slate-400" />
          <input className="w-full border-0 bg-transparent text-xs outline-none" placeholder="Search workers, jobs, employers..." />
        </div>
        <Settings size={18} className="text-slate-500" />
        <Bell size={18} className="text-slate-500" />
        <div className="flex items-center gap-2 border-l pl-4">
          <div className="h-9 w-9 rounded-full bg-slate-200 text-center leading-9 text-xs font-bold">AU</div>
          <span className="text-xs font-semibold">Admin</span>
          <span className="text-xs">⌄</span>
        </div>
      </div>
    </header>
  );
}
