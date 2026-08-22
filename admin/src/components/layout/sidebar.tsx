"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "./auth-actions";
import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarCheck2,
  ClipboardCheck,
  CreditCard,
  Home,
  KeyRound,
  MessageSquare,
  Settings,
  Users,
  UserRoundCheck,
} from "lucide-react";

type SidebarItem = [
  label: string,
  href: string,
  Icon: LucideIcon,
];

const items: SidebarItem[] = [
  ["Dashboard", "/dashboard", Home],

  // User Management
  ["Users", "/users", UserRoundCheck],
  ["Roles & Permissions", "/roles", KeyRound],
  ["Workers", "/workers", Users],
  ["Employers", "/employers", Building2],
  ["Jobs", "/jobs", BriefcaseBusiness],
  ["Applications", "/applications", ClipboardCheck],
  ["Verifications", "/verification", BadgeCheck],
  ["Attendance", "/attendance", CalendarCheck2],
  ["Payments", "/payments", CreditCard],
  ["Reports", "/reports", BarChart3],
  ["Messages", "/messages", MessageSquare],
  ["Settings", "/settings", Settings],
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[238px] flex-col bg-[var(--navy)] text-white">
      <div className="flex h-[82px] items-center gap-3 px-7">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
          <BadgeCheck size={25} strokeWidth={2.5} />
        </div>

        <div>
          <div className="text-[18px] font-bold tracking-tight">
            WorkTrust
          </div>

          <div className="text-[10px] uppercase tracking-[.18em] text-blue-200">
            Admin Portal
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pt-4">
        {items.map(([label, href, Icon]) => {
          const active =
            pathname === href ||
            (href !== "/dashboard" && pathname.startsWith(href));

          return (
            <Link
              key={label}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-[13px] font-semibold transition ${
                active
                  ? "bg-[#0864ec] shadow-lg shadow-blue-950/20"
                  : "text-blue-100 hover:bg-white/10"
              }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="m-4 rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-blue-100 text-center leading-9 text-sm font-bold text-blue-800">
            AU
          </div>

          <div className="min-w-0">
            <div className="truncate text-xs font-bold">
              Admin User
            </div>

            <div className="text-[10px] text-blue-200">
              Super Admin
            </div>
          </div>

          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}
