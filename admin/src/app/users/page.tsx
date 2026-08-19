"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";
import { useUsers } from "@/hooks/use-users";
import type {
  User,
  UserStatus,
} from "@/types/users";

interface RoleOption {
  id: string;
  name: string;
}

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  {
    value: "",
    label: "All Statuses",
  },
  {
    value: "ACTIVE",
    label: "Active",
  },
  {
    value: "INACTIVE",
    label: "Inactive",
  },
];

function getInitials(user: User) {
  const first = user.firstName?.charAt(0) ?? "";
  const last = user.lastName?.charAt(0) ?? "";

  return `${first}${last}`.toUpperCase() || "U";
}

function getFullName(user: User) {
  return [user.firstName, user.lastName]
    .filter(Boolean)
    .join(" ");
}

function formatDate(value: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getRoleLabel(name: string) {
  return name
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const active =
    status.toUpperCase() === "ACTIVE";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
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
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function RoleBadge({
  name,
}: {
  name: string;
}) {
  return (
    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700">
      {getRoleLabel(name)}
    </span>
  );
}

function EmptyState({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
        <UserRound
          size={25}
          className="text-slate-400"
        />
      </div>

      <h3 className="text-sm font-semibold text-slate-900">
        No users found
      </h3>

      <p className="mt-1 max-w-sm text-xs text-slate-500">
        {hasFilters
          ? "No users match the selected filters. Try changing your search or filters."
          : "There are no users available yet."}
      </p>

      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="mt-4 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

export default function UsersPage() {
  const [searchInput, setSearchInput] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [roleId, setRoleId] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [roles, setRoles] =
    useState<RoleOption[]>([]);

  const [rolesLoading, setRolesLoading] =
    useState(false);

  const [rolesError, setRolesError] =
    useState<string | null>(null);

  const {
    users,
    meta,
    loading,
    error,
    fetchUsers,
  } = useUsers({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    status: status || undefined,
    roleId: roleId || undefined,
  });

  /*
   * Load roles for the Role filter.
   *
   * The role IDs come from the backend and are never hard-coded.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadRoles() {
      setRolesLoading(true);
      setRolesError(null);

      try {
        const response = await fetch(
          "/api/roles",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          },
        );

        const data =
          await response.json().catch(
            () => [],
          );

        if (!response.ok) {
          const message =
            typeof data?.message ===
            "string"
              ? data.message
              : "Unable to load roles";

          throw new Error(message);
        }

        if (!cancelled) {
          setRoles(
            Array.isArray(data)
              ? data
              : Array.isArray(data?.data)
                ? data.data
                : [],
          );
        }
      } catch (err) {
        if (!cancelled) {
          setRolesError(
            err instanceof Error
              ? err.message
              : "Unable to load roles",
          );
        }
      } finally {
        if (!cancelled) {
          setRolesLoading(false);
        }
      }
    }

    void loadRoles();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Search is applied when the user presses Enter
   * or clicks the search button.
   */
  function applySearch() {
    setPage(1);
    setSearch(
      searchInput.trim(),
    );
  }

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setStatus("");
    setRoleId("");
    setPage(1);
  }

  function handleStatusChange(
    value: string,
  ) {
    setStatus(value);
    setPage(1);
  }

  function handleRoleChange(
    value: string,
  ) {
    setRoleId(value);
    setPage(1);
  }

  function handlePreviousPage() {
    if (meta.page > 1) {
      setPage(meta.page - 1);
    }
  }

  function handleNextPage() {
    if (
      meta.page < meta.totalPages
    ) {
      setPage(meta.page + 1);
    }
  }

  async function refreshUsers() {
    await fetchUsers({
      page,
      limit: PAGE_SIZE,
      search: search || undefined,
      status: status || undefined,
      roleId: roleId || undefined,
    });
  }

  const hasFilters = useMemo(
    () =>
      Boolean(
        search ||
          status ||
          roleId,
      ),
    [search, status, roleId],
  );

  const showingFrom =
    meta.total === 0
      ? 0
      : (meta.page - 1) *
          meta.limit +
        1;

  const showingTo =
    meta.total === 0
      ? 0
      : Math.min(
          meta.page * meta.limit,
          meta.total,
        );

  return (
    <AdminShell>
    <div className="min-h-screen bg-slate-50">
      <main className="ml-[238px] min-h-screen">
        {/* Header */}
        <div className="border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between px-8 py-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Users
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage platform users and
                their access.
              </p>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-[#0864ec] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              disabled
              title="User creation will be enabled in Pass 2"
            >
              <Plus size={17} />
              Add User
            </button>
          </div>
        </div>

        <div className="px-8 py-6">
          {/* Summary */}
          <div className="mb-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Total Users
                  </p>

                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {meta.total.toLocaleString()}
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <UsersIcon />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Current Page
                  </p>

                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {meta.page}
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                  <ShieldCheck
                    size={19}
                    className="text-emerald-600"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Available Roles
                  </p>

                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {roles.length}
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                  <ShieldCheck
                    size={19}
                    className="text-purple-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                {/* Search */}
                <div className="relative flex-1">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={searchInput}
                    onChange={(event) =>
                      setSearchInput(
                        event.target.value,
                      )
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key ===
                        "Enter"
                      ) {
                        applySearch();
                      }
                    }}
                    placeholder="Search by name, phone or email..."
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <button
                  type="button"
                  onClick={applySearch}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <Search size={15} />
                  Search
                </button>

                {/* Status */}
                <select
                  value={status}
                  onChange={(event) =>
                    handleStatusChange(
                      event.target.value,
                    )
                  }
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {STATUS_OPTIONS.map(
                    (option) => (
                      <option
                        key={option.value}
                        value={
                          option.value
                        }
                      >
                        {option.label}
                      </option>
                    ),
                  )}
                </select>

                {/* Role */}
                <select
                  value={roleId}
                  onChange={(event) =>
                    handleRoleChange(
                      event.target.value,
                    )
                  }
                  disabled={
                    rolesLoading
                  }
                  className="h-10 min-w-[180px] rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                >
                  <option value="">
                    {rolesLoading
                      ? "Loading roles..."
                      : "All Roles"}
                  </option>

                  {roles.map((role) => (
                    <option
                      key={role.id}
                      value={role.id}
                    >
                      {getRoleLabel(
                        role.name,
                      )}
                    </option>
                  ))}
                </select>

                {/* Refresh */}
                <button
                  type="button"
                  onClick={() =>
                    void refreshUsers()
                  }
                  disabled={loading}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Refresh"
                >
                  <RefreshCw
                    size={16}
                    className={
                      loading
                        ? "animate-spin"
                        : ""
                    }
                  />
                </button>

                {/* Clear */}
                {hasFilters && (
                  <button
                    type="button"
                    onClick={
                      clearFilters
                    }
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
                  >
                    <X size={14} />
                    Clear
                  </button>
                )}
              </div>

              {rolesError && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  <AlertCircle
                    size={14}
                  />
                  {rolesError}
                </div>
              )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70">
                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      User
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      Contact
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      Role
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      Created
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <>
                      {Array.from({
                        length: 7,
                      }).map(
                        (_, index) => (
                          <tr
                            key={index}
                            className="border-b border-slate-100"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200" />

                                <div className="space-y-2">
                                  <div className="h-3 w-28 animate-pulse rounded bg-slate-200" />

                                  <div className="h-2.5 w-20 animate-pulse rounded bg-slate-100" />
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <div className="space-y-2">
                                <div className="h-3 w-28 animate-pulse rounded bg-slate-200" />
                                <div className="h-2.5 w-36 animate-pulse rounded bg-slate-100" />
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <div className="h-6 w-20 animate-pulse rounded bg-slate-200" />
                            </td>

                            <td className="px-5 py-4">
                              <div className="h-6 w-16 animate-pulse rounded-full bg-slate-200" />
                            </td>

                            <td className="px-5 py-4">
                              <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
                            </td>
                          </tr>
                        ),
                      )}
                    </>
                  ) : error ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-16"
                      >
                        <div className="flex flex-col items-center justify-center text-center">
                          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                            <AlertCircle
                              size={22}
                              className="text-red-500"
                            />
                          </div>

                          <h3 className="text-sm font-semibold text-slate-900">
                            Unable to load users
                          </h3>

                          <p className="mt-1 text-xs text-slate-500">
                            {error}
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              void refreshUsers()
                            }
                            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                          >
                            <RefreshCw
                              size={14}
                            />
                            Try again
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : users.length ===
                    0 ? (
                    <tr>
                      <td
                        colSpan={5}
                      >
                        <EmptyState
                          hasFilters={
                            hasFilters
                          }
                          onClear={
                            clearFilters
                          }
                        />
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-slate-100 transition hover:bg-slate-50/60"
                      >
                        {/* User */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {user.profilePhotoUrl ? (
                              <img
                                src={
                                  user.profilePhotoUrl
                                }
                                alt={getFullName(
                                  user,
                                )}
                                className="h-9 w-9 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                                {getInitials(
                                  user,
                                )}
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-slate-900">
                                {getFullName(
                                  user,
                                )}
                              </div>

                              <div className="mt-0.5 text-[11px] text-slate-400">
                                ID:{" "}
                                {user.id.slice(
                                  0,
                                  8,
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-5 py-4">
                          <div className="text-xs font-medium text-slate-700">
                            {user.phone ||
                              "-"}
                          </div>

                          <div className="mt-1 max-w-[220px] truncate text-[11px] text-slate-400">
                            {user.email ||
                              "-"}
                          </div>
                        </td>

                        {/* Roles */}
                        <td className="px-5 py-4">
                          <div className="flex max-w-[220px] flex-wrap gap-1.5">
                            {user.roles
                              ?.length ? (
                              user.roles.map(
                                (
                                  role,
                                ) => (
                                  <RoleBadge
                                    key={
                                      role.id
                                    }
                                    name={
                                      role.name
                                    }
                                  />
                                ),
                              )
                            ) : (
                              <span className="text-xs text-slate-400">
                                No role
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <StatusBadge
                            status={
                              user.status
                            }
                          />
                        </td>

                        {/* Created */}
                        <td className="px-5 py-4">
                          <span className="text-xs text-slate-600">
                            {formatDate(
                              user.createdAt,
                            )}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer / Pagination */}
            <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {showingFrom}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-slate-700">
                  {showingTo}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
                  {meta.total}
                </span>{" "}
                users
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={
                    handlePreviousPage
                  }
                  disabled={
                    loading ||
                    meta.page <= 1
                  }
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  title="Previous page"
                >
                  <ChevronLeft
                    size={16}
                  />
                </button>

                <span className="px-2 text-xs font-semibold text-slate-600">
                  Page {meta.page} of{" "}
                  {Math.max(
                    meta.totalPages,
                    1,
                  )}
                </span>

                <button
                  type="button"
                  onClick={
                    handleNextPage
                  }
                  disabled={
                    loading ||
                    meta.page >=
                      meta.totalPages
                  }
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  title="Next page"
                >
                  <ChevronRight
                    size={16}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Small RBAC note */}
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
            <Filter
              size={15}
              className="mt-0.5 shrink-0 text-blue-600"
            />

            <p className="text-xs leading-5 text-blue-700">
              User management actions will be
              permission-aware. Creation,
              editing, role management,
              activation and deletion will be
              enabled in the next UI pass.
            </p>
          </div>
        </div>
      </main>
    </div>
    </AdminShell>
  );
}

function UsersIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-blue-600"
      aria-hidden="true"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle
        cx="9"
        cy="7"
        r="4"
      />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}