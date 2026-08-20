"use client";

import {
  Pencil,
  Save,
  User as UserIcon,
  X,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  CalendarDays,
} from "lucide-react";

import { useEffect, useState } from "react";

import type {
  UpdateUserPayload,
  User,
} from "@/types/users";

interface UserDetailsDialogProps {
  user: User | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (
    id: string,
    payload: UpdateUserPayload,
  ) => Promise<User>;
}

interface FormState {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
}

export function UserDetailsDialog({
  user,
  open,
  onClose,
  onUpdate,
}: UserDetailsDialogProps) {
  const [editing, setEditing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [form, setForm] =
    useState<FormState>({
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      password: "",
    });

  useEffect(() => {
    if (!user) {
      return;
    }

    setForm({
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      phone: user.phone ?? "",
      email: user.email ?? "",
      password: "",
    });

    setEditing(false);
    setError(null);
  }, [user]);

  if (!open || !user) {
    return null;
  }

  function updateField(
    field: keyof FormState,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const payload: UpdateUserPayload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim() || undefined,
        phone: form.phone.trim(),
        email: form.email.trim(),
      };

      if (form.password.trim()) {
        payload.password =
          form.password.trim();
      }

      await onUpdate(user.id, payload);

      setEditing(false);
      setForm((current) => ({
        ...current,
        password: "",
      }));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update user",
      );
    } finally {
      setSaving(false);
    }
  }

  const fullName =
    `${user.firstName} ${user.lastName ?? ""}`.trim();

  const roleNames =
    user.roles?.map((role) => role.name) ?? [];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <UserIcon size={22} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editing
                    ? "Edit User"
                    : "User Details"}
                </h2>

                <p className="text-xs text-slate-500">
                  {fullName || user.email}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!editing && (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setEditing(true);
                }}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <Pencil size={15} />
                Edit
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={19} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!editing ? (
            <div className="space-y-6">
              {/* Profile */}
              <section>
                <h3 className="mb-3 text-sm font-bold text-slate-900">
                  Profile Information
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <InfoItem
                    label="First Name"
                    value={user.firstName}
                  />

                  <InfoItem
                    label="Last Name"
                    value={
                      user.lastName || "—"
                    }
                  />
                </div>
              </section>

              {/* Contact */}
              <section>
                <h3 className="mb-3 text-sm font-bold text-slate-900">
                  Contact Information
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <InfoItem
                    icon={<Phone size={15} />}
                    label="Phone"
                    value={user.phone}
                  />

                  <InfoItem
                    icon={<Mail size={15} />}
                    label="Email"
                    value={user.email}
                  />
                </div>
              </section>

              {/* Access */}
              <section>
                <h3 className="mb-3 text-sm font-bold text-slate-900">
                  Access & Status
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <ShieldCheck size={15} />
                      Roles
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {roleNames.length > 0 ? (
                        roleNames.map((role) => (
                          <span
                            key={role}
                            className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                          >
                            {role}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-400">
                          No roles assigned
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 text-xs font-semibold text-slate-500">
                      Status
                    </div>

                    <StatusBadge
                      status={user.status}
                    />
                  </div>
                </div>
              </section>

              {/* Dates */}
              <section>
                <h3 className="mb-3 text-sm font-bold text-slate-900">
                  Account Information
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <InfoItem
                    icon={
                      <CalendarDays
                        size={15}
                      />
                    }
                    label="Created"
                    value={formatDate(
                      user.createdAt,
                    )}
                  />

                  <InfoItem
                    icon={
                      <CalendarDays
                        size={15}
                      />
                    }
                    label="Last Updated"
                    value={
                      user.updatedAt
                        ? formatDate(
                            user.updatedAt,
                          )
                        : "—"
                    }
                  />
                </div>
              </section>

              {/* Worker */}
              {user.worker && (
                <section>
                  <h3 className="mb-3 text-sm font-bold text-slate-900">
                    Worker Profile
                  </h3>

                  <div className="grid gap-4 md:grid-cols-2">
                    <InfoItem
                      label="Worker Code"
                      value={
                        user.worker
                          .workerCode
                      }
                    />

                    <InfoItem
                      label="Verification Status"
                      value={
                        user.worker
                          .verificationStatus
                      }
                    />
                  </div>
                </section>
              )}

              {/* Employer */}
              {user.employer && (
                <section>
                  <h3 className="mb-3 text-sm font-bold text-slate-900">
                    Employer Profile
                  </h3>

                  <InfoItem
                    label="Employer ID"
                    value={user.employer.id}
                  />
                </section>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <FormField
                label="First Name"
                value={form.firstName}
                onChange={(value) =>
                  updateField(
                    "firstName",
                    value,
                  )
                }
                required
              />

              <FormField
                label="Last Name"
                value={form.lastName}
                onChange={(value) =>
                  updateField(
                    "lastName",
                    value,
                  )
                }
              />

              <FormField
                label="Phone"
                value={form.phone}
                onChange={(value) =>
                  updateField(
                    "phone",
                    value,
                  )
                }
                required
              />

              <FormField
                label="Email"
                type="email"
                value={form.email}
                onChange={(value) =>
                  updateField(
                    "email",
                    value,
                  )
                }
                required
              />

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  New Password
                </label>

                <input
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    updateField(
                      "password",
                      event.target.value,
                    )
                  }
                  placeholder="Leave blank to keep current password"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-1.5 text-xs text-slate-400">
                  Password must contain at least
                  8 characters.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {editing && (
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setEditing(false);
                setError(null);

                setForm({
                  firstName:
                    user.firstName ?? "",
                  lastName:
                    user.lastName ?? "",
                  phone: user.phone ?? "",
                  email: user.email ?? "",
                  password: "",
                });
              }}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
        {icon}
        {label}
      </div>

      <div className="break-words text-sm font-semibold text-slate-900">
        {value}
      </div>
    </div>
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
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active
            ? "bg-emerald-500"
            : "bg-slate-400"
        }`}
      />

      {status}
    </span>
  );
}

function FormField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}

function formatDate(
  value: string,
) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
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