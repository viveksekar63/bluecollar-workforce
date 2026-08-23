"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BriefcaseBusiness, Home, UserRound } from "lucide-react";
import type { ReactNode } from "react";

interface EmployerShellProps {
  children: ReactNode;
}

type EmployerNavItem = {
  label: string;
  href: string;
  icon: typeof Home;
};

// Keep navigation limited to employer features that are currently implemented.
// New employer modules can be added here as their pages are completed.
const items: EmployerNavItem[] = [
  { label: "Dashboard", href: "/employer/dashboard", icon: Home },
  { label: "My Jobs", href: "/employer/jobs", icon: BriefcaseBusiness },
];

export function EmployerShell({ children }: EmployerShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/employer/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link href="/employer/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0757d8] text-white">
              <BriefcaseBusiness size={19} />
            </div>
            <div>
              <div className="font-extrabold tracking-tight text-slate-900">WorkTrust</div>
              <div className="text-[10px] uppercase tracking-[.16em] text-slate-400">Employer Portal</div>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 sm:flex">
              <UserRound size={15} className="text-[#0757d8]" />
              Employer
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 lg:px-8">
          {items.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || (href !== "/employer/dashboard" && pathname.startsWith(`${href}/`));
            return (
              <Link
                key={href}
                href={href}
                className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-xs font-semibold transition ${
                  active
                    ? "border-[#0757d8] text-[#0757d8]"
                    : "border-transparent text-slate-500 hover:border-slate-200 hover:text-slate-900"
                }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      <main className="mx-auto min-h-[calc(100vh-120px)] max-w-7xl px-5 py-7 lg:px-8">
        {children}
      </main>
    </div>
  );
}
