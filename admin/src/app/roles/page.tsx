"use client";

import Link from "next/link";
import {
  AlertCircle,
  KeyRound,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { AdminShell } from "@/components/layout/admin-shell";
import { useRoles } from "@/hooks/use-roles";

import type { Role } from "@/types/roles";

function getRoleLabel(name: string) {
  return name
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) => letter.toUpperCase(),
    );
}

function isSystemRole(name: string) {
  const systemRoles = [
    "SUPER_ADMIN",
    "ADMIN",
    "VERIFICATION_AGENT",
    "EMPLOYER",
    "SUPERVISOR",
    "WORKER",
  ];

  return systemRoles.includes(
    name.toUpperCase(),
  );
}

function RoleBadge({
  name,
}: {
  name: string;
}) {
  return (
    <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
      {getRoleLabel(name)}
    </span>
  );
}

function EmptyState({
  hasSearch,
  onClear,
}: {
  hasSearch: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
        <ShieldCheck
          size={25}
          className="text-slate-400"
        />
      </div>

      <h3 className="text-sm font-semibold text-slate-900">
        No roles found
      </h3>

      <p className="mt-1 max-w-sm text-xs text-slate-500">
        {hasSearch
          ? "No roles match your search. Try a different role name."
          : "There are no roles available yet."}
      </p>

      {hasSearch && (
        <button
          type="button"
          onClick={onClear}
          className="mt-4 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Clear search
        </button>
      )}
    </div>
  );
}

function RolesIcon() {
  return (
    <div className="relative flex items-center justify-center">
      <ShieldCheck
        size={19}
        className="text-blue-600"
      />
    </div>
  );
}

export default function RolesPage() {
  const {
    roles,
    loading,
    error,
    fetchRoles,
  } = useRoles();

  const [searchInput, setSearchInput] =
    useState("");

  const [search, setSearch] =
    useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(
        searchInput.trim(),
      );
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchInput]);

  const filteredRoles = useMemo(() => {
    if (!search) {
      return roles;
    }

    const normalizedSearch =
      search.toLowerCase();

    return roles.filter((role) =>
      role.name
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [roles, search]);

  function clearSearch() {
    setSearchInput("");
    setSearch("");
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Page Header */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <RolesIcon />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Roles & Permissions
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Manage roles and access
                  permissions.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0864ec] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            title="Role creation will be enabled in the next step"
          >
            <Plus size={16} />
            Add Role
          </button>
        </div>

        {/* Search / Toolbar */}

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(
                    event.target.value,
                  )
                }
                placeholder="Search roles..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />

              {searchInput && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                void fetchRoles()
              }
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Error */}

        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-5 py-4">
            <div className="flex items-start gap-3">
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0 text-red-600"
              />

              <div>
                <p className="text-sm font-semibold text-red-800">
                  Unable to load roles
                </p>

                <p className="mt-1 text-xs text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Roles Table */}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Roles
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {loading
                  ? "Loading roles..."
                  : `${filteredRoles.length} ${
                      filteredRoles.length === 1
                        ? "role"
                        : "roles"
                    }`}
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
              <KeyRound
                size={17}
                className="text-blue-600"
              />
            </div>
          </div>

          {loading ? (
            <div className="divide-y divide-slate-100">
              {Array.from({
                length: 6,
              }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 px-5 py-5"
                >
                  <div className="h-10 w-10 animate-pulse rounded-lg bg-slate-100" />

                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
                    <div className="h-3 w-48 animate-pulse rounded bg-slate-100" />
                  </div>

                  <div className="hidden h-6 w-16 animate-pulse rounded bg-slate-100 sm:block" />

                  <div className="hidden h-6 w-20 animate-pulse rounded bg-slate-100 sm:block" />

                  <div className="h-8 w-14 animate-pulse rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : filteredRoles.length === 0 ? (
            <EmptyState
              hasSearch={Boolean(search)}
              onClear={clearSearch}
            />
          ) : (
            <>
              {/* Desktop Table */}

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70">
                      <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        Role
                      </th>

                      <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        Users
                      </th>

                      <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        Permissions
                      </th>

                      <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        Type
                      </th>

                      <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredRoles.map(
                      (role: Role) => (
                        <tr
                          key={role.id}
                          className="transition hover:bg-slate-50/70"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                                <ShieldCheck
                                  size={17}
                                  className="text-blue-600"
                                />
                              </div>

                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-slate-900">
                                  <RoleBadge
                                    name={
                                      role.name
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                              <Users
                                size={15}
                                className="text-slate-400"
                              />
                              {role.userCount}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                              <KeyRound
                                size={15}
                                className="text-slate-400"
                              />
                              {
                                role.permissionCount
                              }
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            {isSystemRole(
                              role.name,
                            ) ? (
                              <span className="inline-flex items-center rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
                                System Role
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                Custom Role
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <Link
                              href={`/roles/${role.id}`}
                              prefetch={false}
                              className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}

              <div className="divide-y divide-slate-100 md:hidden">
                {filteredRoles.map(
                  (role: Role) => (
                    <div
                      key={role.id}
                      className="space-y-4 px-5 py-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                            <ShieldCheck
                              size={18}
                              className="text-blue-600"
                            />
                          </div>

                          <div className="min-w-0">
                            <RoleBadge
                              name={
                                role.name
                              }
                            />
                          </div>
                        </div>

                        {isSystemRole(
                          role.name,
                        ) ? (
                          <span className="shrink-0 rounded-full bg-violet-50 px-2 py-1 text-[10px] font-semibold text-violet-700">
                            System
                          </span>
                        ) : (
                          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                            Custom
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-slate-50 p-3">
                          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            <Users size={13} />
                            Users
                          </div>

                          <p className="mt-1 text-lg font-bold text-slate-900">
                            {role.userCount}
                          </p>
                        </div>

                        <div className="rounded-lg bg-slate-50 p-3">
                          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            <KeyRound size={13} />
                            Permissions
                          </div>

                          <p className="mt-1 text-lg font-bold text-slate-900">
                            {
                              role.permissionCount
                            }
                          </p>
                        </div>
                      </div>

                      <Link
                        href={`/roles/${role.id}`}
                        prefetch={false}
                        className="flex w-full items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        View Role
                      </Link>
                    </div>
                  ),
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </AdminShell>
  );
}