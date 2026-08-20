"use client";

import {
    useCallback,
    useEffect,
    useState,
    useRef
} from "react";

import {
    AlertCircle,
    ArrowLeft,
    BriefcaseBusiness,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Mail,
    Phone,
    RefreshCw,
    ShieldCheck,
    UserRound,
    UsersRound,
} from "lucide-react";

import Link from "next/link";
import { useParams } from "next/navigation";

import { AdminShell } from "@/components/layout/admin-shell";

import type { User } from "@/types/users";

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

function formatDateTime(
    value?: string | null,
) {
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
            hour: "2-digit",
            minute: "2-digit",
        },
    ).format(date);
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
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${active
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

            {active ? "Active" : "Inactive"}
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
    description?: string;
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

                {description && (
                    <p className="mt-0.5 text-xs text-slate-500">
                        {description}
                    </p>
                )}
            </div>
        </div>
    );
}

function DetailItem({
    label,
    value,
    icon,
}: {
    label: string;
    value?: string | null;
    icon?: React.ReactNode;
}) {
    return (
        <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {label}
            </p>

            <div className="flex items-center gap-2">
                {icon && (
                    <span className="text-slate-400">
                        {icon}
                    </span>
                )}

                <p className="break-all text-sm font-medium text-slate-800">
                    {value || "-"}
                </p>
            </div>
        </div>
    );
}

export default function UserDetailsPage() {
    const params = useParams();

    const userId =
        typeof params.id === "string"
            ? params.id
            : "";

    const [user, setUser] =
        useState<User | null>(null);
    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const hasFetchedRef = useRef(false);

    const fetchUser = useCallback(
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
                            credentials: "include",
                            cache: "no-store",
                        },
                    );

                const data =
                    await response
                        .json()
                        .catch(() => ({}));

                if (!response.ok) {
                    const message =
                        typeof data?.message ===
                            "string"
                            ? data.message
                            : "Unable to fetch user.";

                    throw new Error(message);
                }

                setUser(data as User);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to fetch user.",
                );
            } finally {
                setLoading(false);
            }
        },
        [userId],
    );

    useEffect(() => {
        if (!userId) {
            setError("User ID is missing.");
            setLoading(false);
            return;
        }

        let cancelled = false;

        const loadUser = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch(
                    `/api/users/${userId}`,
                    {
                        method: "GET",
                        credentials: "include",
                        cache: "no-store",
                    },
                );

                const data = await response
                    .json()
                    .catch(() => ({}));

                if (!response.ok) {
                    throw new Error(
                        typeof data?.message === "string"
                            ? data.message
                            : "Unable to fetch user.",
                    );
                }

                if (!cancelled) {
                    setUser(data as User);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Unable to fetch user.",
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void loadUser();

        return () => {
            cancelled = true;
        };
    }, [userId]);

    return (
        <AdminShell>
            <div className="min-h-screen bg-slate-50">
                <main className="ml-[238px] min-h-screen">
                    {/* Header */}
                    <div className="border-b border-slate-200 bg-white">
                        <div className="px-8 py-5">
                            <Link
                                href="/users"
                                className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-slate-900"
                            >
                                <ArrowLeft size={15} />
                                Back to Users
                            </Link>

                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                        User Details
                                    </h1>

                                    <p className="mt-1 text-sm text-slate-500">
                                        View user profile,
                                        roles and account
                                        information.
                                    </p>
                                </div>

                                {user && (
                                    <StatusBadge
                                        status={user.status}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="px-8 py-6">
                        {/* Loading */}
                        {loading && (
                            <div className="flex min-h-[500px] items-center justify-center rounded-xl border border-slate-200 bg-white">
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <RefreshCw
                                        size={17}
                                        className="animate-spin"
                                    />

                                    Loading user...
                                </div>
                            </div>
                        )}

                        {/* Error */}
                        {!loading && error && (
                            <div className="rounded-xl border border-red-100 bg-white">
                                <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                                        <AlertCircle
                                            size={22}
                                            className="text-red-500"
                                        />
                                    </div>

                                    <h2 className="text-sm font-bold text-slate-900">
                                        Unable to load user
                                    </h2>

                                    <p className="mt-1 max-w-md text-xs text-slate-500">
                                        {error}
                                    </p>

                                    <div className="mt-5 flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                void fetchUser()
                                            }
                                            className="inline-flex items-center gap-2 rounded-lg bg-[#0864ec] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                                        >
                                            <RefreshCw size={14} />
                                            Try Again
                                        </button>

                                        <Link
                                            href="/users"
                                            className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                        >
                                            Back to Users
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* User */}
                        {!loading &&
                            !error &&
                            user && (
                                <div className="space-y-5">
                                    {/* Profile Header */}
                                    <div className="rounded-xl border border-slate-200 bg-white p-6">
                                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex items-center gap-4">
                                                {user.profilePhotoUrl ? (
                                                    <img
                                                        src={
                                                            user.profilePhotoUrl
                                                        }
                                                        alt={getFullName(
                                                            user,
                                                        )}
                                                        className="h-20 w-20 rounded-full object-cover ring-4 ring-slate-50"
                                                    />
                                                ) : (
                                                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-xl font-bold text-blue-700 ring-4 ring-slate-50">
                                                        {getInitials(
                                                            user,
                                                        )}
                                                    </div>
                                                )}

                                                <div>
                                                    <h2 className="text-xl font-bold text-slate-900">
                                                        {getFullName(
                                                            user,
                                                        )}
                                                    </h2>

                                                    <p className="mt-1 text-xs text-slate-400">
                                                        User ID: {user.id}
                                                    </p>

                                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                                        {user.roles?.length >
                                                            0 ? (
                                                            user.roles.map(
                                                                (role) => (
                                                                    <span
                                                                        key={
                                                                            role.id
                                                                        }
                                                                        className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700"
                                                                    >
                                                                        {getRoleLabel(
                                                                            role.name,
                                                                        )}
                                                                    </span>
                                                                ),
                                                            )
                                                        ) : (
                                                            <span className="text-xs text-slate-400">
                                                                No roles assigned
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <Link
                                                href={`/users/${user.id}/edit`}
                                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                            >
                                                Edit User
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Personal Information */}
                                    <div className="rounded-xl border border-slate-200 bg-white p-6">
                                        <SectionHeader
                                            icon={
                                                <UserRound size={18} />
                                            }
                                            title="Personal Information"
                                            description="Basic profile information for this user."
                                        />

                                        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                            <DetailItem
                                                label="First Name"
                                                value={
                                                    user.firstName
                                                }
                                            />

                                            <DetailItem
                                                label="Last Name"
                                                value={
                                                    user.lastName
                                                }
                                            />

                                            <DetailItem
                                                label="Status"
                                                value={
                                                    user.status
                                                }
                                            />
                                        </div>
                                    </div>

                                    {/* Contact Information */}
                                    <div className="rounded-xl border border-slate-200 bg-white p-6">
                                        <SectionHeader
                                            icon={
                                                <Phone size={18} />
                                            }
                                            title="Contact Information"
                                            description="Contact details associated with this account."
                                        />

                                        <div className="mt-6 grid gap-6 sm:grid-cols-2">
                                            <DetailItem
                                                label="Phone Number"
                                                value={user.phone}
                                                icon={
                                                    <Phone size={15} />
                                                }
                                            />

                                            <DetailItem
                                                label="Email Address"
                                                value={user.email}
                                                icon={
                                                    <Mail size={15} />
                                                }
                                            />
                                        </div>
                                    </div>

                                    {/* Roles & Access */}
                                    <div className="rounded-xl border border-slate-200 bg-white p-6">
                                        <SectionHeader
                                            icon={
                                                <ShieldCheck
                                                    size={18}
                                                />
                                            }
                                            title="Roles & Access"
                                            description="Roles currently assigned to this user."
                                        />

                                        <div className="mt-6">
                                            {user.roles?.length >
                                                0 ? (
                                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                                    {user.roles.map(
                                                        (role) => (
                                                            <div
                                                                key={
                                                                    role.id
                                                                }
                                                                className="rounded-lg border border-slate-200 bg-slate-50/50 p-4"
                                                            >
                                                                <div className="flex items-start gap-3">
                                                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                                                                        <ShieldCheck
                                                                            size={17}
                                                                            className="text-blue-600"
                                                                        />
                                                                    </div>

                                                                    <div className="min-w-0">
                                                                        <p className="text-sm font-semibold text-slate-900">
                                                                            {getRoleLabel(
                                                                                role.name,
                                                                            )}
                                                                        </p>

                                                                        <p className="mt-1 break-all text-[11px] text-slate-400">
                                                                            {role.id}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="rounded-lg border border-dashed border-slate-200 px-5 py-8 text-center">
                                                    <ShieldCheck
                                                        size={22}
                                                        className="mx-auto text-slate-300"
                                                    />

                                                    <p className="mt-2 text-xs font-semibold text-slate-600">
                                                        No roles assigned
                                                    </p>

                                                    <p className="mt-1 text-[11px] text-slate-400">
                                                        This user currently
                                                        has no assigned
                                                        roles.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Profile Associations */}
                                    {(user.worker ||
                                        user.employer) && (
                                            <div className="rounded-xl border border-slate-200 bg-white p-6">
                                                <SectionHeader
                                                    icon={
                                                        <BriefcaseBusiness
                                                            size={18}
                                                        />
                                                    }
                                                    title="Profile Associations"
                                                    description="Workforce or employer profile associated with this account."
                                                />

                                                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                                    {user.worker && (
                                                        <div className="rounded-lg border border-slate-200 p-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
                                                                    <UsersRound
                                                                        size={17}
                                                                        className="text-amber-600"
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <p className="text-sm font-semibold text-slate-900">
                                                                        Worker Profile
                                                                    </p>

                                                                    <p className="mt-1 text-xs text-slate-500">
                                                                        Worker Code:{" "}
                                                                        <span className="font-semibold text-slate-700">
                                                                            {
                                                                                user
                                                                                    .worker
                                                                                    .workerCode
                                                                            }
                                                                        </span>
                                                                    </p>

                                                                    <p className="mt-1 text-xs text-slate-500">
                                                                        Verification:{" "}
                                                                        <span className="font-semibold text-slate-700">
                                                                            {
                                                                                user
                                                                                    .worker
                                                                                    .verificationStatus
                                                                            }
                                                                        </span>
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {user.employer && (
                                                        <div className="rounded-lg border border-slate-200 p-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50">
                                                                    <BriefcaseBusiness
                                                                        size={17}
                                                                        className="text-purple-600"
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <p className="text-sm font-semibold text-slate-900">
                                                                        Employer Profile
                                                                    </p>

                                                                    <p className="mt-1 break-all text-xs text-slate-500">
                                                                        Employer ID:{" "}
                                                                        <span className="font-semibold text-slate-700">
                                                                            {
                                                                                user
                                                                                    .employer
                                                                                    .id
                                                                            }
                                                                        </span>
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                    {/* Account Information */}
                                    <div className="rounded-xl border border-slate-200 bg-white p-6">
                                        <SectionHeader
                                            icon={
                                                <CalendarDays
                                                    size={18}
                                                />
                                            }
                                            title="Account Information"
                                            description="Account lifecycle information."
                                        />

                                        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                            <DetailItem
                                                label="User ID"
                                                value={user.id}
                                            />

                                            <DetailItem
                                                label="Created"
                                                value={formatDateTime(
                                                    user.createdAt,
                                                )}
                                                icon={
                                                    <CalendarDays
                                                        size={15}
                                                    />
                                                }
                                            />

                                            <DetailItem
                                                label="Last Updated"
                                                value={formatDateTime(
                                                    user.updatedAt,
                                                )}
                                                icon={
                                                    <Clock3 size={15} />
                                                }
                                            />
                                        </div>
                                    </div>

                                    {/* Status Footer */}
                                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2
                                                size={17}
                                                className={
                                                    user.status.toUpperCase() ===
                                                        "ACTIVE"
                                                        ? "text-emerald-500"
                                                        : "text-slate-400"
                                                }
                                            />

                                            <span className="text-xs text-slate-500">
                                                Account status
                                            </span>

                                            <StatusBadge
                                                status={
                                                    user.status
                                                }
                                            />
                                        </div>

                                        <Link
                                            href="/users"
                                            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                                        >
                                            Back to Users
                                        </Link>
                                    </div>
                                </div>
                            )}
                    </div>
                </main>
            </div>
        </AdminShell>
    );
}