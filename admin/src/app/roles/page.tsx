"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Eye,
  KeyRound,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";

import { AdminShell } from "@/components/layout/admin-shell";
import { useRoles } from "@/hooks/use-roles";

const SYSTEM_ROLES = new Set([
  "SUPER_ADMIN",
  "ADMIN",
  "VERIFICATION_AGENT",
  "EMPLOYER",
  "SUPERVISOR",
  "WORKER",
]);

function formatRoleName(name: string) {
  return name
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function RolesPage() {
  const { roles, loading, error, fetchRoles } = useRoles();
  const [search, setSearch] = useState("");

  const filteredRoles = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return roles;
    }

    return roles.filter((role) =>
      role.name.toLowerCase().includes(value),
    );
  }, [roles, search]);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <ShieldCheck size={21} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Roles & Permissions
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Manage roles and access permissions.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled
            title="Role creation will be enabled in the next step"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0864ec] px-4 py-2.5 text-sm font-semibold text-white opacity-60 shadow-sm"
          >
            <Plus size={17} />
            Add Role
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search roles..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <button
              type="button"
              onClick={() => void fetchRoles()}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          {error && (
            <div className="m-5 flex items-start gap-3 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold">Unable to load roles</div>
                <div className="mt-0.5 text-xs">{error}</div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70">
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Role
                  </th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Users
                  </th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Permissions
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading && roles.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-14 text-center">
                      <RefreshCw size={22} className="mx-auto animate-spin text-blue-600" />
                      <p className="mt-3 text-sm text-slate-500">Loading roles...</p>
                    </td>
                  </tr>
                )}

                {!loading && !error && filteredRoles.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-14 text-center">
                      <KeyRound size={25} className="mx-auto text-slate-300" />
                      <p className="mt-3 text-sm font-semibold text-slate-700">
                        No roles found
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Try changing your search.
                      </p>
                    </td>
                  </tr>
                )}

                {filteredRoles.map((role) => {
                  const systemRole = SYSTEM_ROLES.has(role.name);

                  return (
                    <tr key={role.id} className="transition hover:bg-slate-50/70">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                            <ShieldCheck size={17} />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">
                              {formatRoleName(role.name)}
                            </div>
                            <div className="mt-0.5 text-xs text-slate-400">
                              {role.name}
                              {systemRole && " • System role"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <Users size={15} className="text-slate-400" />
                          {role.userCount}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {role.permissionCount} permissions
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end">
                          <Link
                            href={`/roles/${role.id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                          >
                            <Eye size={13} />
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!loading && filteredRoles.length > 0 && (
            <div className="border-t border-slate-200 px-5 py-4 text-xs text-slate-500">
              Showing {filteredRoles.length} of {roles.length} roles
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
