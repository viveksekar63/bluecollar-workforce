"use client";

import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    AlertCircle,
    ArrowLeft,
    Check,
    CheckCircle2,
    Loader2,
    RefreshCw,
    ShieldCheck,
    UserRound,
} from "lucide-react";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { AdminShell } from "@/components/layout/admin-shell";
import { useUsers } from "@/hooks/use-users";

import type {
    UpdateUserPayload,
    User,
} from "@/types/users";

interface RoleOption {
    id: string;
    name: string;
}

interface FormState {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    roleIds: string[];
}

const INITIAL_FORM: FormState = {
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    roleIds: [],
};

function getFullName(user: User) {
    return [
        user.firstName,
        user.lastName,
    ]
        .filter(Boolean)
        .join(" ");
}

function getInitials(user: User) {
    const first =
        user.firstName?.charAt(0) ?? "";

    const last =
        user.lastName?.charAt(0) ?? "";

    return (
        `${first}${last}`.toUpperCase() ||
        "U"
    );
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
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
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

function SectionHeader({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                {icon}
            </div>

            <div>
                <h2 className="text-sm font-bold text-slate-900">
                    {title}
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                    {description}
                </p>
            </div>
        </div>
    );
}

export default function EditUserPage() {
    const params = useParams();
    const router = useRouter();

    const userId =
        typeof params.id === "string"
            ? params.id
            : "";

    const {
        updateUser,
        updateUserRoles,
    } = useUsers();

    const [user, setUser] =
        useState<User | null>(null);

    const [roles, setRoles] =
        useState<RoleOption[]>([]);

    const [form, setForm] =
        useState<FormState>(
            INITIAL_FORM,
        );

    const [loading, setLoading] =
        useState(true);

    const [rolesLoading, setRolesLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const [success, setSuccess] =
        useState<string | null>(null);

    const loadUser = useCallback(
        async () => {
            if (!userId) {
                setError(
                    "User ID is missing.",
                );
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const response =
                    await fetch(
                        `/api/users/${userId}`,
                        {
                            method: "GET",
                            credentials:
                                "include",
                            cache: "no-store",
                        },
                    );

                const data =
                    await response
                        .json()
                        .catch(() => ({}));

                if (!response.ok) {
                    throw new Error(
                        typeof data?.message ===
                            "string"
                            ? data.message
                            : "Unable to load user.",
                    );
                }

                const loadedUser =
                    data as User;

                setUser(loadedUser);

                setForm({
                    firstName:
                        loadedUser.firstName ??
                        "",
                    lastName:
                        loadedUser.lastName ??
                        "",
                    phone:
                        loadedUser.phone ?? "",
                    email:
                        loadedUser.email ?? "",
                    roleIds:
                        loadedUser.roles?.map(
                            (role) =>
                                role.id,
                        ) ?? [],
                });
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load user.",
                );
            } finally {
                setLoading(false);
            }
        },
        [userId],
    );

    const loadRoles = useCallback(
        async () => {
            setRolesLoading(true);

            try {
                const response =
                    await fetch(
                        "/api/roles",
                        {
                            method: "GET",
                            credentials:
                                "include",
                            cache: "no-store",
                        },
                    );

                const data =
                    await response
                        .json()
                        .catch(() => []);

                if (!response.ok) {
                    throw new Error(
                        typeof data?.message ===
                            "string"
                            ? data.message
                            : "Unable to load roles.",
                    );
                }

                const roleList =
                    Array.isArray(data)
                        ? data
                        : Array.isArray(
                              data?.data,
                          )
                          ? data.data
                          : [];

                setRoles(roleList);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load roles.",
                );
            } finally {
                setRolesLoading(false);
            }
        },
        [],
    );

    useEffect(() => {
        void loadUser();
        void loadRoles();
    }, [loadUser, loadRoles]);

    function updateField(
        field:
            | "firstName"
            | "lastName"
            | "phone"
            | "email",
        value: string,
    ) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));

        setError(null);
        setSuccess(null);
    }

    function toggleRole(
        roleId: string,
    ) {
        setForm((current) => {
            const selected =
                current.roleIds.includes(
                    roleId,
                );

            return {
                ...current,
                roleIds: selected
                    ? current.roleIds.filter(
                          (id) =>
                              id !== roleId,
                      )
                    : [
                          ...current.roleIds,
                          roleId,
                      ],
            };
        });

        setError(null);
        setSuccess(null);
    }

    function validateForm() {
        if (!form.firstName.trim()) {
            return "First name is required.";
        }

        if (!form.phone.trim()) {
            return "Phone number is required.";
        }

        if (
            !/^\d{10,20}$/.test(
                form.phone.trim(),
            )
        ) {
            return "Phone number must contain 10 to 20 digits.";
        }

        if (!form.email.trim()) {
            return "Email address is required.";
        }

        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                form.email.trim(),
            )
        ) {
            return "Please enter a valid email address.";
        }

        if (form.roleIds.length === 0) {
            return "Please select at least one role.";
        }

        return null;
    }

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        const validationError =
            validateForm();

        if (validationError) {
            setError(validationError);
            return;
        }

        if (!userId) {
            setError(
                "User ID is missing.",
            );
            return;
        }

        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const payload: UpdateUserPayload =
                {
                    firstName:
                        form.firstName.trim(),
                    lastName:
                        form.lastName.trim() ||
                        undefined,
                    phone:
                        form.phone.trim(),
                    email:
                        form.email.trim(),
                };

            await updateUser(
                userId,
                payload,
            );

            await updateUserRoles(
                userId,
                {
                    roleIds:
                        form.roleIds,
                },
            );

            setSuccess(
                "User updated successfully.",
            );

            setTimeout(() => {
                router.push(
                    `/users/${userId}`,
                );
            }, 700);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to update user.",
            );
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <AdminShell>
                <div className="min-h-screen bg-slate-50">
                    <main className="ml-[238px] min-h-screen">
                        <div className="flex min-h-[600px] items-center justify-center">
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <RefreshCw
                                    size={17}
                                    className="animate-spin"
                                />

                                Loading user...
                            </div>
                        </div>
                    </main>
                </div>
            </AdminShell>
        );
    }

    if (!user) {
        return (
            <AdminShell>
                <div className="min-h-screen bg-slate-50">
                    <main className="ml-[238px] min-h-screen">
                        <div className="px-8 py-6">
                            <Link
                                href="/users"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
                            >
                                <ArrowLeft
                                    size={15}
                                />
                                Back to Users
                            </Link>

                            <div className="mt-5 rounded-xl border border-red-100 bg-white">
                                <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
                                    <AlertCircle
                                        size={24}
                                        className="text-red-500"
                                    />

                                    <h2 className="mt-3 text-sm font-bold text-slate-900">
                                        Unable to load
                                        user
                                    </h2>

                                    <p className="mt-1 text-xs text-slate-500">
                                        {error ??
                                            "The requested user could not be found."}
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            void loadUser()
                                        }
                                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#0864ec] px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700"
                                    >
                                        <RefreshCw
                                            size={14}
                                        />
                                        Try Again
                                    </button>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </AdminShell>
        );
    }

    return (
        <AdminShell>
            <div className="min-h-screen bg-slate-50">
                <main className="ml-[238px] min-h-screen">
                    {/* Header */}
                    <div className="border-b border-slate-200 bg-white">
                        <div className="px-8 py-5">
                            <Link
                                href={`/users/${user.id}`}
                                className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-slate-900"
                            >
                                <ArrowLeft
                                    size={15}
                                />
                                Back to User
                            </Link>

                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                        Edit User
                                    </h1>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Update user profile
                                        and access roles.
                                    </p>
                                </div>

                                <StatusBadge
                                    status={
                                        user.status
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    <div className="px-8 py-6">
                        <form
                            onSubmit={
                                handleSubmit
                            }
                            className="mx-auto max-w-4xl space-y-5"
                        >
                            {/* User Summary */}
                            <div className="rounded-xl border border-slate-200 bg-white p-6">
                                <div className="flex items-center gap-4">
                                    {user.profilePhotoUrl ? (
                                        <img
                                            src={
                                                user.profilePhotoUrl
                                            }
                                            alt={getFullName(
                                                user,
                                            )}
                                            className="h-16 w-16 rounded-full object-cover ring-4 ring-slate-50"
                                        />
                                    ) : (
                                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-lg font-bold text-blue-700 ring-4 ring-slate-50">
                                            {getInitials(
                                                user,
                                            )}
                                        </div>
                                    )}

                                    <div>
                                        <h2 className="text-base font-bold text-slate-900">
                                            {getFullName(
                                                user,
                                            )}
                                        </h2>

                                        <p className="mt-1 text-xs text-slate-400">
                                            User ID:{" "}
                                            {
                                                user.id
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">
                                    <AlertCircle
                                        size={16}
                                        className="mt-0.5 shrink-0"
                                    />

                                    <span>
                                        {error}
                                    </span>
                                </div>
                            )}

                            {/* Success */}
                            {success && (
                                <div className="flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
                                    <CheckCircle2
                                        size={16}
                                        className="mt-0.5 shrink-0"
                                    />

                                    <span>
                                        {success}
                                    </span>
                                </div>
                            )}

                            {/* Personal Information */}
                            <section className="rounded-xl border border-slate-200 bg-white p-6">
                                <SectionHeader
                                    icon={
                                        <UserRound
                                            size={
                                                18
                                            }
                                        />
                                    }
                                    title="Personal Information"
                                    description="Update the user's basic profile information."
                                />

                                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                                            First Name
                                            <span className="ml-1 text-red-500">
                                                *
                                            </span>
                                        </label>

                                        <input
                                            type="text"
                                            value={
                                                form.firstName
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                updateField(
                                                    "firstName",
                                                    event
                                                        .target
                                                        .value,
                                                )
                                            }
                                            disabled={
                                                saving
                                            }
                                            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                                            Last Name
                                        </label>

                                        <input
                                            type="text"
                                            value={
                                                form.lastName
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                updateField(
                                                    "lastName",
                                                    event
                                                        .target
                                                        .value,
                                                )
                                            }
                                            disabled={
                                                saving
                                            }
                                            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Contact Information */}
                            <section className="rounded-xl border border-slate-200 bg-white p-6">
                                <h2 className="text-sm font-bold text-slate-900">
                                    Contact Information
                                </h2>

                                <p className="mt-0.5 text-xs text-slate-500">
                                    Update the user's
                                    phone and email
                                    address.
                                </p>

                                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                                            Phone Number
                                            <span className="ml-1 text-red-500">
                                                *
                                            </span>
                                        </label>

                                        <input
                                            type="tel"
                                            inputMode="numeric"
                                            value={
                                                form.phone
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                updateField(
                                                    "phone",
                                                    event
                                                        .target
                                                        .value.replace(
                                                            /\D/g,
                                                            "",
                                                        ),
                                                )
                                            }
                                            maxLength={
                                                20
                                            }
                                            disabled={
                                                saving
                                            }
                                            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                                            Email Address
                                            <span className="ml-1 text-red-500">
                                                *
                                            </span>
                                        </label>

                                        <input
                                            type="email"
                                            value={
                                                form.email
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                updateField(
                                                    "email",
                                                    event
                                                        .target
                                                        .value,
                                                )
                                            }
                                            disabled={
                                                saving
                                            }
                                            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Roles */}
                            <section className="rounded-xl border border-slate-200 bg-white p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <SectionHeader
                                        icon={
                                            <ShieldCheck
                                                size={
                                                    18
                                                }
                                            />
                                        }
                                        title="Roles & Access"
                                        description="Select the roles assigned to this user."
                                    />

                                    {form.roleIds
                                        .length >
                                        0 && (
                                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                                            {
                                                form
                                                    .roleIds
                                                    .length
                                            }{" "}
                                            selected
                                        </span>
                                    )}
                                </div>

                                <div className="mt-6">
                                    {rolesLoading ? (
                                        <div className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-10 text-xs text-slate-500">
                                            <Loader2
                                                size={
                                                    16
                                                }
                                                className="animate-spin"
                                            />
                                            Loading
                                            roles...
                                        </div>
                                    ) : roles.length ===
                                      0 ? (
                                        <div className="rounded-lg border border-dashed border-slate-200 px-5 py-10 text-center">
                                            <ShieldCheck
                                                size={
                                                    22
                                                }
                                                className="mx-auto text-slate-300"
                                            />

                                            <p className="mt-2 text-xs font-semibold text-slate-600">
                                                No roles
                                                available
                                            </p>

                                            <p className="mt-1 text-[11px] text-slate-400">
                                                Please
                                                configure
                                                roles before
                                                assigning
                                                access.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {roles.map(
                                                (
                                                    role,
                                                ) => {
                                                    const selected =
                                                        form.roleIds.includes(
                                                            role.id,
                                                        );

                                                    return (
                                                        <button
                                                            key={
                                                                role.id
                                                            }
                                                            type="button"
                                                            onClick={() =>
                                                                toggleRole(
                                                                    role.id,
                                                                )
                                                            }
                                                            disabled={
                                                                saving
                                                            }
                                                            className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left transition ${
                                                                selected
                                                                    ? "border-blue-300 bg-blue-50"
                                                                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div
                                                                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                                                                        selected
                                                                            ? "bg-blue-100"
                                                                            : "bg-slate-100"
                                                                    }`}
                                                                >
                                                                    <ShieldCheck
                                                                        size={
                                                                            16
                                                                        }
                                                                        className={
                                                                            selected
                                                                                ? "text-blue-600"
                                                                                : "text-slate-400"
                                                                        }
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <p
                                                                        className={`text-xs font-semibold ${
                                                                            selected
                                                                                ? "text-blue-800"
                                                                                : "text-slate-800"
                                                                        }`}
                                                                    >
                                                                        {getRoleLabel(
                                                                            role.name,
                                                                        )}
                                                                    </p>

                                                                    <p className="mt-0.5 text-[10px] text-slate-400">
                                                                        {
                                                                            role.id
                                                                        }
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <span
                                                                className={`flex h-5 w-5 items-center justify-center rounded border ${
                                                                    selected
                                                                        ? "border-blue-600 bg-blue-600"
                                                                        : "border-slate-300 bg-white"
                                                                }`}
                                                            >
                                                                {selected && (
                                                                    <Check
                                                                        size={
                                                                            13
                                                                        }
                                                                        className="text-white"
                                                                    />
                                                                )}
                                                            </span>
                                                        </button>
                                                    );
                                                },
                                            )}
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Actions */}
                            <div className="sticky bottom-0 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                                <Link
                                    href={`/users/${user.id}`}
                                    className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Cancel
                                </Link>

                                <button
                                    type="submit"
                                    disabled={
                                        saving ||
                                        rolesLoading
                                    }
                                    className="inline-flex items-center gap-2 rounded-lg bg-[#0864ec] px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {saving && (
                                        <Loader2
                                            size={
                                                15
                                            }
                                            className="animate-spin"
                                        />
                                    )}

                                    {saving
                                        ? "Saving..."
                                        : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </AdminShell>
    );
}