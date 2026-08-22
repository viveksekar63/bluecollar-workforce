"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import {
  useParams,
  useRouter,
} from "next/navigation";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { AdminShell } from "@/components/layout/admin-shell";
import { useRoles } from "@/hooks/use-roles";

import type {
  RoleDetails,
} from "@/types/roles";

function getFullName(
  firstName: string | null,
  lastName: string | null,
) {
  return (
    [firstName, lastName]
      .filter(Boolean)
      .join(" ") ||
    "Unnamed User"
  );
}

function getInitials(
  firstName: string | null,
  lastName: string | null,
) {
  const first =
    firstName?.charAt(0) ?? "";

  const last =
    lastName?.charAt(0) ?? "";

  return (
    `${first}${last}`.toUpperCase() ||
    "U"
  );
}

function formatRoleName(name: string) {
  return name
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}

function formatPermissionName(
  name: string,
) {
  return name
    .replaceAll("_", " ")
    .replaceAll(".", " · ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
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

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const active =
    status.toUpperCase() ===
    "ACTIVE";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
          active
            ? "bg-emerald-500"
            : "bg-slate-400"
        }`}
      />

      {active
        ? "Active"
        : "Inactive"}
    </span>
  );
}

export default function RoleDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const roleId =
    typeof params.id === "string"
      ? params.id
      : "";

  const {
    getRole,
  } = useRoles();

  const [role, setRole] =
    useState<RoleDetails | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const loadRole = useCallback(
    async () => {
      if (!roleId) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data =
          await getRole(roleId);

        setRole(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load role",
        );
      } finally {
        setLoading(false);
      }
    },
    [getRole, roleId],
  );

  useEffect(() => {
    void loadRole();
  }, [loadRole]);

  if (loading) {
    return (
      <AdminShell>
        <div className="space-y-6">
          <div className="h-6 w-36 animate-pulse rounded bg-slate-200" />

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 animate-pulse rounded-xl bg-slate-100" />

              <div className="space-y-2">
                <div className="h-5 w-40 animate-pulse rounded bg-slate-100" />

                <div className="h-3 w-56 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({
              length: 3,
            }).map((_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-xl bg-white"
              />
            ))}
          </div>

          <div className="h-64 animate-pulse rounded-xl bg-white" />

          <div className="h-64 animate-pulse rounded-xl bg-white" />
        </div>
      </AdminShell>
    );
  }

  if (error) {
    return (
      <AdminShell>
        <div className="space-y-6">
          <Link
            href="/roles"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft size={16} />
            Back to Roles
          </Link>

          <div className="rounded-xl border border-red-100 bg-red-50 px-5 py-5">
            <div className="flex items-start gap-3">
              <AlertCircle
                size={19}
                className="mt-0.5 shrink-0 text-red-600"
              />

              <div className="min-w-0">
                <h2 className="text-sm font-bold text-red-800">
                  Unable to load role
                </h2>

                <p className="mt-1 text-xs text-red-700">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    void loadRole()
                  }
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                >
                  <RefreshCw size={14} />
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </AdminShell>
    );
  }

  if (!role) {
    return (
      <AdminShell>
        <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <ShieldCheck
              size={26}
              className="text-slate-400"
            />
          </div>

          <h2 className="mt-4 text-lg font-bold text-slate-900">
            Role not found
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            The requested role could not be
            found.
          </p>

          <Link
            href="/roles"
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft size={15} />
            Back to Roles
          </Link>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              href="/roles"
              className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
            >
              <ArrowLeft size={15} />
              Back to Roles
            </Link>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                <ShieldCheck
                  size={23}
                  className="text-blue-600"
                />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    {formatRoleName(
                      role.name,
                    )}
                  </h1>

                  {isSystemRole(
                    role.name,
                  ) && (
                    <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-semibold text-violet-700">
                      System Role
                    </span>
                  )}
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  View role users and assigned
                  permissions.
                </p>
              </div>
            </div>
          </div>

          <Link
            href={`/roles/${role.id}/edit`}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0864ec] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <KeyRound size={15} />
            Edit Permissions
          </Link>
        </div>

        {/* Summary */}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Role
                </p>

                <p className="mt-2 text-lg font-bold text-slate-900">
                  {formatRoleName(
                    role.name,
                  )}
                </p>
              </div>

              <div className="rounded-lg bg-blue-50 p-2.5">
                <ShieldCheck
                  size={19}
                  className="text-blue-600"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Users
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {role.users.length}
                </p>
              </div>

              <div className="rounded-lg bg-emerald-50 p-2.5">
                <Users
                  size={19}
                  className="text-emerald-600"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Permissions
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {role.permissions.length}
                </p>
              </div>

              <div className="rounded-lg bg-violet-50 p-2.5">
                <KeyRound
                  size={19}
                  className="text-violet-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Users */}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Users
                    size={17}
                    className="text-slate-500"
                  />

                  <h2 className="text-sm font-bold text-slate-900">
                    Assigned Users
                  </h2>
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  Users currently assigned to
                  this role.
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                {role.users.length}
              </span>
            </div>
          </div>

          {role.users.length === 0 ? (
            <div className="flex min-h-[180px] flex-col items-center justify-center px-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <UserRound
                  size={22}
                  className="text-slate-400"
                />
              </div>

              <p className="mt-3 text-sm font-semibold text-slate-700">
                No users assigned
              </p>

              <p className="mt-1 text-xs text-slate-500">
                No users currently have this
                role.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {role.users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-slate-50/70"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                      {getInitials(
                        user.firstName,
                        user.lastName,
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {getFullName(
                          user.firstName,
                          user.lastName,
                        )}
                      </p>

                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="truncate text-xs text-slate-500">
                          {user.email}
                        </p>

                        {user.phone && (
                          <>
                            <span className="text-slate-300">
                              •
                            </span>

                            <p className="text-xs text-slate-500">
                              {user.phone}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <StatusBadge
                    status={
                      user.status
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Assigned Permissions */}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <KeyRound
                    size={17}
                    className="text-slate-500"
                  />

                  <h2 className="text-sm font-bold text-slate-900">
                    Assigned Permissions
                  </h2>
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  Permissions currently assigned
                  to this role.
                </p>
              </div>

              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">
                {role.permissions.length}
              </span>
            </div>
          </div>

          {role.permissions.length === 0 ? (
            <div className="flex min-h-[180px] flex-col items-center justify-center px-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <KeyRound
                  size={22}
                  className="text-slate-400"
                />
              </div>

              <p className="mt-3 text-sm font-semibold text-slate-700">
                No permissions assigned
              </p>

              <p className="mt-1 text-xs text-slate-500">
                This role does not currently have
                any permissions.
              </p>

              <Link
                href={`/roles/${role.id}/edit`}
                className="mt-4 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Assign permissions
              </Link>
            </div>
          ) : (
            <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
              {role.permissions.map(
                (permission) => (
                  <div
                    key={permission.id}
                    className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-50">
                        <CheckCircle2
                          size={15}
                          className="text-emerald-600"
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="break-words text-sm font-semibold text-slate-800">
                          {formatPermissionName(
                            permission.name,
                          )}
                        </p>

                        {permission.description && (
                          <p className="mt-1.5 text-xs leading-5 text-slate-500">
                            {
                              permission.description
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}