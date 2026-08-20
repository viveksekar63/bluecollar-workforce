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
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import { AdminShell } from "@/components/layout/admin-shell";
import { CreateUserDialog } from "@/components/users/create-user-dialog";
import { useUsers } from "@/hooks/use-users";
import Link from "next/link";

import type {
  CreateUserPayload,
  User,
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
  const first =
    user.firstName?.charAt(0) ?? "";

  const last =
    user.lastName?.charAt(0) ?? "";

  return (
    `${first}${last}`.toUpperCase() || "U"
  );
}

function getFullName(user: User) {
  return [
    user.firstName,
    user.lastName,
  ]
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

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(date);
}

function getRoleLabel(name: string) {
  return name
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
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
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${active
        ? "bg-emerald-50 text-emerald-700"
        : "bg-slate-100 text-slate-600"
        }`}
    >
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${active
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

function UsersIcon() {
  return (
    <div className="relative flex items-center justify-center">
      <UserRound
        size={19}
        className="text-blue-600"
      />
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

  const [createUserOpen, setCreateUserOpen] =
    useState(false);
  const [deleteUserOpen, setDeleteUserOpen] =
    useState(false);

  const [selectedUser, setSelectedUser] =
    useState<User | null>(null);

  const [deleteLoading, setDeleteLoading] =
    useState(false);

  const [deleteError, setDeleteError] =
    useState<string | null>(null);

  const {
    users,
    meta,
    loading,
    error,
    fetchUsers,
    createUser,
    deleteUser,
  } = useUsers({
    page,
    limit: PAGE_SIZE,
    search:
      search || undefined,
    status:
      status || undefined,
    roleId:
      roleId || undefined,
  });

  /*
   * Load roles for the Role filter
   * and Create User dialog.
   *
   * Role IDs come from the backend
   * and are never hard-coded.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadRoles() {
      setRolesLoading(true);
      setRolesError(null);

      try {
        const response =
          await fetch(
            "/api/roles",
            {
              method: "GET",
              credentials: "include",
              cache: "no-store",
            },
          );

        const data =
          await response
            .json()
            .catch(() => []);

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
              : Array.isArray(
                data?.data,
              )
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
   * Search is applied when the user
   * presses Enter or clicks Search.
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
      meta.page <
      meta.totalPages
    ) {
      setPage(meta.page + 1);
    }
  }

  async function refreshUsers() {
    await fetchUsers({
      page,
      limit: PAGE_SIZE,
      search:
        search || undefined,
      status:
        status || undefined,
      roleId:
        roleId || undefined,
    });
  }

  async function handleCreateUser(
    payload: CreateUserPayload,
  ) {
    await createUser(payload);

    setCreateUserOpen(false);

    setPage(1);

    await fetchUsers({
      page: 1,
      limit: PAGE_SIZE,
      search:
        search || undefined,
      status:
        status || undefined,
      roleId:
        roleId || undefined,
    });
  }

  async function handleDeleteUser() {
    if (!selectedUser) {
      return;
    }

    setDeleteLoading(true);
    setDeleteError(null);

    try {
      await deleteUser(selectedUser.id);

      setDeleteUserOpen(false);
      setSelectedUser(null);

      /*
      * If the last user on the current page
      * was deleted, move back one page.
      */
      const remainingUsersOnPage =
        users.length - 1;

      if (
        remainingUsersOnPage === 0 &&
        meta.page > 1
      ) {
        setPage(meta.page - 1);
      } else {
        await fetchUsers({
          page,
          limit: PAGE_SIZE,
          search:
            search || undefined,
          status:
            status || undefined,
          roleId:
            roleId || undefined,
        });
      }
    } catch (err) {
      setDeleteError(
        err instanceof Error
          ? err.message
          : "Unable to delete user",
      );
    } finally {
      setDeleteLoading(false);
    }
  }

  const hasFilters = useMemo(
    () =>
      Boolean(
        search ||
        status ||
        roleId,
      ),
    [
      search,
      status,
      roleId,
    ],
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
        meta.page *
        meta.limit,
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
                  Manage platform users
                  and their access.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setCreateUserOpen(
                    true,
                  )
                }
                className="inline-flex items-center gap-2 rounded-lg bg-[#0864ec] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
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
                      value={
                        searchInput
                      }
                      onChange={(
                        event,
                      ) =>
                        setSearchInput(
                          event.target
                            .value,
                        )
                      }
                      onKeyDown={(
                        event,
                      ) => {
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
                    onClick={
                      applySearch
                    }
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    <Search size={15} />
                    Search
                  </button>

                  {/* Status */}
                  <select
                    value={status}
                    onChange={(
                      event,
                    ) =>
                      handleStatusChange(
                        event.target
                          .value,
                      )
                    }
                    className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {STATUS_OPTIONS.map(
                      (option) => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {
                            option.label
                          }
                        </option>
                      ),
                    )}
                  </select>

                  {/* Role */}
                  <select
                    value={roleId}
                    onChange={(
                      event,
                    ) =>
                      handleRoleChange(
                        event.target
                          .value,
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

                    {roles.map(
                      (role) => (
                        <option
                          key={role.id}
                          value={role.id}
                        >
                          {getRoleLabel(
                            role.name,
                          )}
                        </option>
                      ),
                    )}
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

              {/* Error */}
              {error && (
                <div className="m-5 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">
                  <AlertCircle
                    size={15}
                    className="mt-0.5 shrink-0"
                  />

                  <div>
                    <p className="font-semibold">
                      Unable to load
                      users
                    </p>

                    <p className="mt-0.5">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div className="flex min-h-[320px] items-center justify-center">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <RefreshCw
                      size={17}
                      className="animate-spin"
                    />

                    Loading users...
                  </div>
                </div>
              )}

              {/* Empty */}
              {!loading &&
                !error &&
                users.length === 0 && (
                  <EmptyState
                    hasFilters={
                      hasFilters
                    }
                    onClear={
                      clearFilters
                    }
                  />
                )}

              {/* Table */}
              {!loading &&
                users.length > 0 && (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[900px]">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50/70">
                            <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                              User
                            </th>

                            <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                              Contact
                            </th>

                            <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                              Roles
                            </th>

                            <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                              Status
                            </th>

                            <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                              Created
                            </th>

                            <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                              Actions
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {users.map(
                            (user) => (
                              <tr
                                key={
                                  user.id
                                }
                                className="border-b border-slate-100 transition hover:bg-slate-50/70"
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
                                      <p className="truncate text-sm font-semibold text-slate-900">
                                        {getFullName(
                                          user,
                                        )}
                                      </p>

                                      <p className="mt-0.5 truncate text-xs text-slate-400">
                                        {user.id}
                                      </p>
                                    </div>
                                  </div>
                                </td>

                                {/* Contact */}
                                <td className="px-5 py-4">
                                  <div>
                                    <p className="text-sm text-slate-700">
                                      {user.phone ||
                                        "-"}
                                    </p>

                                    <p className="mt-0.5 text-xs text-slate-400">
                                      {user.email ||
                                        "-"}
                                    </p>
                                  </div>
                                </td>

                                {/* Roles */}
                                <td className="px-5 py-4">
                                  <div className="flex max-w-[260px] flex-wrap gap-1.5">
                                    {user.roles &&
                                      user.roles
                                        .length >
                                      0 ? (
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
                                        No roles
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
                                <td className="px-5 py-4 text-sm text-slate-600">
                                  {formatDate(
                                    user.createdAt,
                                  )}
                                </td>

                                {/* Actions */}
                                <td className="px-5 py-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Link
                                      href={`/users/${user.id}`}
                                      prefetch={false}
                                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                                    >
                                      View
                                    </Link>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedUser(user);
                                        setDeleteError(null);
                                        setDeleteUserOpen(true);
                                      }}
                                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                                    >
                                      <Trash2 size={13} />
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-slate-500">
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
                      </p>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={
                            handlePreviousPage
                          }
                          disabled={
                            meta.page <=
                            1 ||
                            loading
                          }
                          className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ChevronLeft
                            size={15}
                          />

                          Previous
                        </button>

                        <span className="px-2 text-xs font-semibold text-slate-600">
                          Page{" "}
                          {meta.page}{" "}
                          of{" "}
                          {meta.totalPages ||
                            1}
                        </span>

                        <button
                          type="button"
                          onClick={
                            handleNextPage
                          }
                          disabled={
                            meta.page >=
                            meta.totalPages ||
                            loading
                          }
                          className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Next

                          <ChevronRight
                            size={15}
                          />
                        </button>
                      </div>
                    </div>
                  </>
                )}
            </div>
          </div>
        </main>
      </div>

      {/* Create User Dialog */}
      <CreateUserDialog
        open={createUserOpen}
        roles={roles}
        rolesLoading={
          rolesLoading
        }
        onClose={() =>
          setCreateUserOpen(false)
        }
        onSubmit={
          handleCreateUser
        }
      />
      {deleteUserOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-lg font-bold text-slate-900">
                Delete User
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                This action cannot be undone.
              </p>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm text-slate-700">
                Are you sure you want to delete
                {" "}
                <span className="font-semibold text-slate-900">
                  {getFullName(selectedUser)}
                </span>
                ?
              </p>

              {deleteError && (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">
                  <AlertCircle
                    size={15}
                    className="mt-0.5 shrink-0"
                  />

                  <span>{deleteError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => {
                  setDeleteUserOpen(false);
                  setSelectedUser(null);
                  setDeleteError(null);
                }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => void handleDeleteUser()}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleteLoading && (
                  <RefreshCw
                    size={15}
                    className="animate-spin"
                  />
                )}

                {deleteLoading
                  ? "Deleting..."
                  : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}