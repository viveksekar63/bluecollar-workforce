"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Save,
  ShieldCheck,
} from "lucide-react";
import {
  useParams,
  useRouter,
} from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { AdminShell } from "@/components/layout/admin-shell";
import { useRoles } from "@/hooks/use-roles";

import type {
  RoleDetails,
  RolePermission,
} from "@/types/roles";

function formatRoleName(name: string) {
  return name
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
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
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function getPermissionGroup(
  permissionName: string,
) {
  const [group] =
    permissionName.split(".");

  return group || "other";
}

function formatGroupName(
  group: string,
) {
  return group
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
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

export default function EditRolePermissionsPage() {
  const params = useParams();
  const router = useRouter();

  const roleId =
    typeof params.id === "string"
      ? params.id
      : "";

  const {
    getRole,
    getPermissions,
    getRolePermissions,
    updateRolePermissions,
  } = useRoles();

  const [role, setRole] =
    useState<RoleDetails | null>(null);

  const [permissions, setPermissions] =
    useState<RolePermission[]>([]);

  const [
    selectedPermissionIds,
    setSelectedPermissionIds,
  ] = useState<Set<string>>(
    new Set(),
  );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState<string | null>(null);

  const loadData = useCallback(
    async () => {
      if (!roleId) {
        return;
      }

      setLoading(true);
      setError(null);
      setSuccess(null);

      try {
        const [
          roleData,
          allPermissions,
          rolePermissions,
        ] = await Promise.all([
          getRole(roleId),
          getPermissions(),
          getRolePermissions(roleId),
        ]);

        setRole(roleData);
        setPermissions(allPermissions);

        setSelectedPermissionIds(
          new Set(
            rolePermissions.map(
              (permission) =>
                permission.id,
            ),
          ),
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load role permissions",
        );
      } finally {
        setLoading(false);
      }
    },
    [
      getRole,
      getPermissions,
      getRolePermissions,
      roleId,
    ],
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const permissionGroups = useMemo(() => {
    const groups =
      new Map<
        string,
        RolePermission[]
      >();

    for (const permission of permissions) {
      const group =
        getPermissionGroup(
          permission.name,
        );

      const current =
        groups.get(group) ?? [];

      current.push(permission);

      groups.set(group, current);
    }

    return Array.from(
      groups.entries(),
    ).sort(([a], [b]) =>
      a.localeCompare(b),
    );
  }, [permissions]);

  const selectedCount =
    selectedPermissionIds.size;

  const totalCount =
    permissions.length;

  const allSelected =
    totalCount > 0 &&
    selectedCount === totalCount;

  function togglePermission(
    permissionId: string,
  ) {
    setSuccess(null);

    setSelectedPermissionIds(
      (current) => {
        const next = new Set(
          current,
        );

        if (
          next.has(permissionId)
        ) {
          next.delete(permissionId);
        } else {
          next.add(permissionId);
        }

        return next;
      },
    );
  }

  function toggleGroup(
    groupPermissions: RolePermission[],
  ) {
    setSuccess(null);

    setSelectedPermissionIds(
      (current) => {
        const next = new Set(
          current,
        );

        const groupSelected =
          groupPermissions.every(
            (permission) =>
              next.has(
                permission.id,
              ),
          );

        for (const permission of groupPermissions) {
          if (groupSelected) {
            next.delete(
              permission.id,
            );
          } else {
            next.add(
              permission.id,
            );
          }
        }

        return next;
      },
    );
  }

  function selectAll() {
    setSuccess(null);

    if (allSelected) {
      setSelectedPermissionIds(
        new Set(),
      );
      return;
    }

    setSelectedPermissionIds(
      new Set(
        permissions.map(
          (permission) =>
            permission.id,
        ),
      ),
    );
  }

  async function handleSave() {
    if (!roleId) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updatedRole =
        await updateRolePermissions(
          roleId,
          {
            permissionIds:
              Array.from(
                selectedPermissionIds,
              ),
          },
        );

      setRole(updatedRole);

      setSuccess(
        "Permissions updated successfully.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update permissions",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminShell>
        <div className="space-y-6">
          <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 animate-pulse rounded-xl bg-slate-100" />

              <div className="space-y-2">
                <div className="h-5 w-44 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-64 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          </div>

          <div className="h-24 animate-pulse rounded-xl bg-white" />

          <div className="h-[500px] animate-pulse rounded-xl bg-white" />
        </div>
      </AdminShell>
    );
  }

  if (error && !role) {
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

              <div>
                <h2 className="text-sm font-bold text-red-800">
                  Unable to load permissions
                </h2>

                <p className="mt-1 text-xs text-red-700">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    void loadData()
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
          <ShieldCheck
            size={40}
            className="text-slate-300"
          />

          <h2 className="mt-4 text-lg font-bold text-slate-900">
            Role not found
          </h2>

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
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Back */}

        <Link
          href={`/roles/${role.id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft size={15} />
          Back to Role
        </Link>

        {/* Header */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
              <ShieldCheck
                size={23}
                className="text-blue-600"
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Edit Permissions
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
                Configure permissions for{" "}
                <span className="font-semibold text-slate-700">
                  {formatRoleName(
                    role.name,
                  )}
                </span>
                .
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
              {selectedCount} of{" "}
              {totalCount} selected
            </span>
          </div>
        </div>

        {/* Messages */}

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <div>
              <p className="text-sm font-semibold text-red-800">
                Unable to save permissions
              </p>

              <p className="mt-1 text-xs text-red-700">
                {error}
              </p>
            </div>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <CheckCircle2
              size={18}
              className="mt-0.5 shrink-0 text-emerald-600"
            />

            <div>
              <p className="text-sm font-semibold text-emerald-800">
                Permissions updated
              </p>

              <p className="mt-1 text-xs text-emerald-700">
                {success}
              </p>
            </div>
          </div>
        )}

        {/* Permission Toolbar */}

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50/70 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Permissions
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Select the permissions this
                role should have.
              </p>
            </div>

            <button
              type="button"
              onClick={selectAll}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {allSelected ? (
                <>
                  <Check size={14} />
                  Clear All
                </>
              ) : (
                <>
                  <CheckCircle2
                    size={14}
                  />
                  Select All
                </>
              )}
            </button>
          </div>

          <div className="divide-y divide-slate-200">
            {permissionGroups.map(
              ([
                group,
                groupPermissions,
              ]) => {
                const groupSelected =
                  groupPermissions.every(
                    (permission) =>
                      selectedPermissionIds.has(
                        permission.id,
                      ),
                  );

                const groupSelectedCount =
                  groupPermissions.filter(
                    (permission) =>
                      selectedPermissionIds.has(
                        permission.id,
                      ),
                  ).length;

                return (
                  <section
                    key={group}
                    className="px-6 py-5"
                  >
                    {/* Group header */}

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {formatGroupName(
                            group,
                          )}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          {
                            groupSelectedCount
                          }{" "}
                          of{" "}
                          {
                            groupPermissions.length
                          }{" "}
                          permissions
                          selected
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          toggleGroup(
                            groupPermissions,
                          )
                        }
                        className={`inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold transition ${
                          groupSelected
                            ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                            : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {groupSelected
                          ? "Clear Group"
                          : "Select Group"}
                      </button>
                    </div>

                    {/* Permissions */}

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {groupPermissions.map(
                        (
                          permission,
                        ) => {
                          const selected =
                            selectedPermissionIds.has(
                              permission.id,
                            );

                          return (
                            <label
                              key={
                                permission.id
                              }
                              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                                selected
                                  ? "border-blue-200 bg-blue-50/50"
                                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={
                                  selected
                                }
                                onChange={() =>
                                  togglePermission(
                                    permission.id,
                                  )
                                }
                                className="sr-only"
                              />

                              <div
                                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                                  selected
                                    ? "border-blue-600 bg-blue-600 text-white"
                                    : "border-slate-300 bg-white"
                                }`}
                              >
                                {selected && (
                                  <Check
                                    size={
                                      13
                                    }
                                    strokeWidth={
                                      3
                                    }
                                  />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-900">
                                  {formatPermissionName(
                                    permission.name,
                                  )}
                                </p>

                                <p className="mt-1 text-[11px] leading-5 text-slate-500">
                                  {
                                    permission.description
                                  }
                                </p>

                                <span className="mt-2 inline-flex rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-500">
                                  {
                                    permission.name
                                  }
                                </span>
                              </div>
                            </label>
                          );
                        },
                      )}
                    </div>
                  </section>
                );
              },
            )}

            {permissions.length ===
              0 && (
              <div className="px-6 py-12 text-center">
                <ShieldCheck
                  size={32}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-3 text-sm font-semibold text-slate-700">
                  No permissions found
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  There are currently no
                  permissions configured in
                  the system.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
            <Link
              href={`/roles/${role.id}`}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="button"
              onClick={() =>
                void handleSave()
              }
              disabled={
                saving ||
                permissions.length ===
                  0
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0864ec] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Save size={16} />
              )}

              {saving
                ? "Saving..."
                : "Save Permissions"}
            </button>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}