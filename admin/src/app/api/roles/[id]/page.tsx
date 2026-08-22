"use client";

import Link from "next/link";
import {
  useParams,
  useRouter,
} from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import {
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
    `${first}${last}` ||
    "U"
  ).toUpperCase();
}

function formatPermissionName(
  name: string,
) {
  return name
    .replace(/\./g, " · ")
    .replace(/_/g, " ");
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

  useEffect(() => {
    if (!roleId) {
      return;
    }

    let cancelled = false;

    async function loadRole() {
      setLoading(true);
      setError(null);

      try {
        const data =
          await getRole(roleId);

        if (!cancelled) {
          setRole(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load role",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadRole();

    return () => {
      cancelled = true;
    };
  }, [roleId, getRole]);

  if (loading) {
    return (
      <AdminShell>
        <div className="space-y-6">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />

          <div className="h-32 animate-pulse rounded-xl bg-white" />

          <div className="h-64 animate-pulse rounded-xl bg-white" />
        </div>
      </AdminShell>
    );
  }

  if (error) {
    return (
      <AdminShell>
        <div className="space-y-6">
          <button
            type="button"
            onClick={() =>
              router.push("/roles")
            }
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft size={16} />
            Back to Roles
          </button>

          <div className="rounded-xl border border-red-100 bg-red-50 p-5">
            <div className="flex items-start gap-3">
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0 text-red-600"
              />

              <div>
                <h2 className="font-semibold text-red-800">
                  Unable to load role
                </h2>

                <p className="mt-1 text-sm text-red-700">
                  {error}
                </p>
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
        <div className="rounded-xl bg-white p-10 text-center">
          <ShieldCheck
            size={32}
            className="mx-auto text-slate-400"
          />

          <h2 className="mt-3 text-lg font-bold text-slate-900">
            Role not found
          </h2>

          <Link
            href="/roles"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
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

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() =>
                router.push("/roles")
              }
              className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
            >
              <ArrowLeft size={15} />
              Back to Roles
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <ShieldCheck
                  size={23}
                />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  {role.name}
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Role details and assigned
                  permissions
                </p>
              </div>
            </div>
          </div>

          <Link
            href={`/roles/${role.id}/edit`}
            className="inline-flex items-center justify-center rounded-lg bg-[#0864ec] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Edit Permissions
          </Link>
        </div>

        {/* Summary */}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Role
                </p>

                <p className="mt-2 text-lg font-bold text-slate-900">
                  {role.name}
                </p>
              </div>

              <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
                <ShieldCheck
                  size={20}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Users
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {role.users.length}
                </p>
              </div>

              <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600">
                <Users size={20} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Permissions
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {role.permissions.length}
                </p>
              </div>

              <div className="rounded-lg bg-violet-50 p-2.5 text-violet-600">
                <ShieldCheck
                  size={20}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Users */}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-center gap-3">
              <Users
                size={19}
                className="text-slate-500"
              />

              <div>
                <h2 className="font-bold text-slate-900">
                  Assigned Users
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Users currently assigned to
                  this role
                </p>
              </div>
            </div>
          </div>

          {role.users.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <UserRound
                size={30}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 text-sm font-semibold text-slate-600">
                No users assigned
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {role.users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between px-6 py-4"
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

                      <p className="truncate text-xs text-slate-500">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`ml-4 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                      user.status.toUpperCase() ===
                      "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {user.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Permissions */}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <CheckCircle2
                    size={19}
                    className="text-slate-500"
                  />

                  <h2 className="font-bold text-slate-900">
                    Assigned Permissions
                  </h2>
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  Permissions currently assigned
                  to this role
                </p>
              </div>

              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                {role.permissions.length}
              </span>
            </div>
          </div>

          {role.permissions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <ShieldCheck
                size={30}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 text-sm font-semibold text-slate-600">
                No permissions assigned
              </p>

              <Link
                href={`/roles/${role.id}/edit`}
                className="mt-3 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Assign permissions
              </Link>
            </div>
          ) : (
            <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3">
              {role.permissions.map(
                (permission) => (
                  <div
                    key={permission.id}
                    className="rounded-lg border border-slate-200 bg-slate-50/50 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-md bg-emerald-50 p-1.5 text-emerald-600">
                        <CheckCircle2
                          size={15}
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="break-words text-sm font-semibold text-slate-800">
                          {formatPermissionName(
                            permission.name,
                          )}
                        </p>

                        {permission.description && (
                          <p className="mt-1 text-xs leading-5 text-slate-500">
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