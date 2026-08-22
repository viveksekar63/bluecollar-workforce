"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  KeyRound,
  Loader2,
  Save,
  ShieldCheck,
  X,
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

function formatPermissionName(
  name: string,
) {
  const lastPart =
    name.split(".").pop() ?? name;

  return lastPart
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}

function formatModuleName(
  name: string,
) {
  const parts = name.split(".");

  const moduleName =
    parts.length > 1
      ? parts[0]
      : name;

  return moduleName
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}

function getPermissionGroup(
  permission: RolePermission,
) {
  return (
    permission.name
      .split(".")[0] ||
    "General"
  );
}

function groupPermissions(
  permissions: RolePermission[],
) {
  const groups =
    new Map<
      string,
      RolePermission[]
    >();

  permissions.forEach(
    (permission) => {
      const group =
        getPermissionGroup(
          permission,
        );

      const existing =
        groups.get(group) ?? [];

      existing.push(permission);

      groups.set(
        group,
        existing,
      );
    },
  );

  return Array.from(
    groups.entries(),
  ).sort(([a], [b]) =>
    a.localeCompare(b),
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
    updateRolePermissions,
  } = useRoles();

  const [role, setRole] =
    useState<RoleDetails | null>(
      null,
    );

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

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    expandedGroups,
    setExpandedGroups,
  ] = useState<Set<string>>(
    new Set(),
  );

  const loadData = useCallback(
    async () => {
      if (!roleId) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [
          roleData,
          permissionData,
        ] = await Promise.all([
          getRole(roleId),
          getPermissions(),
        ]);

        setRole(roleData);
        setPermissions(
          permissionData,
        );

        const assignedIds =
          new Set(
            roleData.permissions.map(
              (permission) =>
                permission.id,
            ),
          );

        setSelectedPermissionIds(
          assignedIds,
        );

        const groups =
          groupPermissions(
            permissionData,
          );

        setExpandedGroups(
          new Set(
            groups.map(
              ([group]) => group,
            ),
          ),
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load permissions",
        );
      } finally {
        setLoading(false);
      }
    },
    [
      getPermissions,
      getRole,
      roleId,
    ],
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredPermissions =
    useMemo(() => {
      const search =
        searchTerm
          .trim()
          .toLowerCase();

      if (!search) {
        return permissions;
      }

      return permissions.filter(
        (permission) =>
          permission.name
            .toLowerCase()
            .includes(search) ||
          (
            permission.description ??
            ""
          )
            .toLowerCase()
            .includes(search),
      );
    }, [
      permissions,
      searchTerm,
    ]);

  const groups = useMemo(
    () =>
      groupPermissions(
        filteredPermissions,
      ),
    [filteredPermissions],
  );

  const selectedCount =
    selectedPermissionIds.size;

  const allPermissionCount =
    permissions.length;

  const allSelected =
    allPermissionCount > 0 &&
    selectedCount ===
      allPermissionCount;

  const togglePermission =
    (permissionId: string) => {
      setSelectedPermissionIds(
        (current) => {
          const next =
            new Set(current);

          if (
            next.has(permissionId)
          ) {
            next.delete(
              permissionId,
            );
          } else {
            next.add(
              permissionId,
            );
          }

          return next;
        },
      );

      setSuccess(null);
    };

  const toggleGroup = (
    group: string,
    groupPermissionsList: RolePermission[],
  ) => {
    setSelectedPermissionIds(
      (current) => {
        const next =
          new Set(current);

        const groupSelected =
          groupPermissionsList.every(
            (permission) =>
              next.has(
                permission.id,
              ),
          );

        if (groupSelected) {
          groupPermissionsList.forEach(
            (permission) => {
              next.delete(
                permission.id,
              );
            },
          );
        } else {
          groupPermissionsList.forEach(
            (permission) => {
              next.add(
                permission.id,
              );
            },
          );
        }

        return next;
      },
    );

    setSuccess(null);

    setExpandedGroups(
      (current) => {
        const next =
          new Set(current);

        next.add(group);

        return next;
      },
    );
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedPermissionIds(
        new Set(),
      );
    } else {
      setSelectedPermissionIds(
        new Set(
          permissions.map(
            (permission) =>
              permission.id,
          ),
        ),
      );
    }

    setSuccess(null);
  };

  const toggleGroupExpanded = (
    group: string,
  ) => {
    setExpandedGroups(
      (current) => {
        const next =
          new Set(current);

        if (next.has(group)) {
          next.delete(group);
        } else {
          next.add(group);
        }

        return next;
      },
    );
  };

  const handleSave =
    async () => {
      if (!roleId) {
        return;
      }

      setSaving(true);
      setError(null);
      setSuccess(null);

      try {
        const updated =
          await updateRolePermissions(
            roleId,
            {
              permissionIds:
                Array.from(
                  selectedPermissionIds,
                ),
            },
          );

        setRole(updated);

        setSelectedPermissionIds(
          new Set(
            updated.permissions.map(
              (permission) =>
                permission.id,
            ),
          ),
        );

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
    };

  if (loading) {
    return (
      <AdminShell>
        <div className="space-y-6">
          <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />

          <div className="h-28 animate-pulse rounded-xl bg-white" />

          <div className="h-16 animate-pulse rounded-xl bg-white" />

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
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft size={15} />
            Back to Roles
          </Link>

          <div className="rounded-xl border border-red-200 bg-red-50 p-5">
            <h2 className="text-sm font-bold text-red-800">
              Unable to load role
            </h2>

            <p className="mt-1 text-sm text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                void loadData()
              }
              className="mt-4 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-red-700 shadow-sm ring-1 ring-red-200 hover:bg-red-50"
            >
              Try Again
            </button>
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
            size={36}
            className="text-slate-300"
          />

          <h2 className="mt-4 text-lg font-bold text-slate-900">
            Role not found
          </h2>

          <Link
            href="/roles"
            className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Back to Roles
          </Link>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="space-y-6 pb-24">
        {/* Header */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link
              href={`/roles/${role.id}`}
              className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
            >
              <ArrowLeft size={15} />
              Back to Role
            </Link>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                <KeyRound
                  size={22}
                  className="text-blue-600"
                />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Edit Permissions
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Manage permissions for{" "}
                  <span className="font-semibold text-slate-700">
                    {role.name
                      .replaceAll(
                        "_",
                        " ",
                      )
                      .toLowerCase()
                      .replace(
                        /\b\w/g,
                        (
                          letter,
                        ) =>
                          letter.toUpperCase(),
                      )}
                  </span>
                  .
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/roles/${role.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <X size={15} />
              Cancel
            </Link>

            <button
              type="button"
              onClick={() =>
                void handleSave()
              }
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0864ec] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <Loader2
                  size={15}
                  className="animate-spin"
                />
              ) : (
                <Save size={15} />
              )}

              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Success */}

        {success && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <CheckCircle2
              size={18}
              className="shrink-0 text-emerald-600"
            />

            <p className="text-sm font-semibold text-emerald-800">
              {success}
            </p>
          </div>
        )}

        {/* Error */}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-semibold text-red-800">
              {error}
            </p>
          </div>
        )}

        {/* Summary */}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Role
            </p>

            <p className="mt-2 text-lg font-bold text-slate-900">
              {role.name
                .replaceAll(
                  "_",
                  " ",
                )
                .toLowerCase()
                .replace(
                  /\b\w/g,
                  (letter) =>
                    letter.toUpperCase(),
                )}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Selected
            </p>

            <p className="mt-2 text-2xl font-bold text-blue-600">
              {selectedCount}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              of {allPermissionCount}{" "}
              permissions
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Permission Groups
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {groups.length}
            </p>
          </div>
        </div>

        {/* Controls */}

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <label
                htmlFor="permission-search"
                className="sr-only"
              >
                Search permissions
              </label>

              <input
                id="permission-search"
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value,
                  )
                }
                placeholder="Search permissions..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleAll}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {allSelected ? (
                  <X size={14} />
                ) : (
                  <Check size={14} />
                )}

                {allSelected
                  ? "Clear All"
                  : "Select All"}
              </button>

              <span className="rounded-lg bg-blue-50 px-3 py-2.5 text-xs font-bold text-blue-700">
                {selectedCount} selected
              </span>
            </div>
          </div>
        </section>

        {/* Permissions */}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4">
            <div className="flex items-center gap-2">
              <ShieldCheck
                size={17}
                className="text-slate-500"
              />

              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Permission Matrix
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Select the permissions this
                  role should have.
                </p>
              </div>
            </div>
          </div>

          {groups.length === 0 ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center px-6 text-center">
              <KeyRound
                size={30}
                className="text-slate-300"
              />

              <p className="mt-3 text-sm font-semibold text-slate-700">
                No permissions found
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Try changing your search.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {groups.map(
                ([
                  group,
                  groupPermissionList,
                ]) => {
                  const groupSelected =
                    groupPermissionList.every(
                      (permission) =>
                        selectedPermissionIds.has(
                          permission.id,
                        ),
                    );

                  const groupSomeSelected =
                    groupPermissionList.some(
                      (permission) =>
                        selectedPermissionIds.has(
                          permission.id,
                        ),
                    );

                  const expanded =
                    expandedGroups.has(
                      group,
                    );

                  return (
                    <div
                      key={group}
                      className="bg-white"
                    >
                      <div className="flex items-center justify-between gap-4 px-5 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            toggleGroupExpanded(
                              group,
                            )
                          }
                          className="flex min-w-0 flex-1 items-center gap-3 text-left"
                        >
                          <ChevronDown
                            size={17}
                            className={`shrink-0 text-slate-400 transition ${
                              expanded
                                ? ""
                                : "-rotate-90"
                            }`}
                          />

                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900">
                              {formatModuleName(
                                group,
                              )}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-500">
                              {
                                groupPermissionList.length
                              }{" "}
                              permissions
                            </p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            toggleGroup(
                              group,
                              groupPermissionList,
                            )
                          }
                          className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                            groupSelected
                              ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                              : groupSomeSelected
                              ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {groupSelected
                            ? "Clear Group"
                            : "Select Group"}
                        </button>
                      </div>

                      {expanded && (
                        <div className="border-t border-slate-100 bg-slate-50/40 px-5 py-4">
                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {groupPermissionList.map(
                              (
                                permission,
                              ) => {
                                const checked =
                                  selectedPermissionIds.has(
                                    permission.id,
                                  );

                                return (
                                  <label
                                    key={
                                      permission.id
                                    }
                                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                                      checked
                                        ? "border-blue-200 bg-blue-50/60"
                                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={
                                        checked
                                      }
                                      onChange={() =>
                                        togglePermission(
                                          permission.id,
                                        )
                                      }
                                      className="peer sr-only"
                                    />

                                    <span
                                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
                                        checked
                                          ? "border-blue-600 bg-blue-600 text-white"
                                          : "border-slate-300 bg-white"
                                      }`}
                                    >
                                      {checked && (
                                        <Check
                                          size={
                                            13
                                          }
                                          strokeWidth={
                                            3
                                          }
                                        />
                                      )}
                                    </span>

                                    <span className="min-w-0">
                                      <span className="block text-sm font-semibold text-slate-800">
                                        {formatPermissionName(
                                          permission.name,
                                        )}
                                      </span>

                                      {permission.description && (
                                        <span className="mt-1 block text-xs leading-5 text-slate-500">
                                          {
                                            permission.description
                                          }
                                        </span>
                                      )}

                                      <span className="mt-1.5 block truncate text-[10px] font-medium text-slate-400">
                                        {
                                          permission.name
                                        }
                                      </span>
                                    </span>
                                  </label>
                                );
                              },
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                },
              )}
            </div>
          )}
        </section>

        {/* Bottom action bar */}

        <div className="sticky bottom-4 z-20 flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white/95 px-5 py-3 shadow-lg backdrop-blur">
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900">
              {selectedCount} permissions
              selected
            </p>

            <p className="hidden text-xs text-slate-500 sm:block">
              Save your changes when you're
              finished.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/roles/${role.id}`}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="button"
              onClick={() =>
                void handleSave()
              }
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0864ec] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <Loader2
                  size={14}
                  className="animate-spin"
                />
              ) : (
                <Save size={14} />
              )}

              Save Permissions
            </button>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}