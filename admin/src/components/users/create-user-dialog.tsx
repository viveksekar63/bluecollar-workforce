"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  X,
} from "lucide-react";

import type {
  CreateUserPayload,
  UserRole,
} from "@/types/users";

interface CreateUserDialogProps {
  open: boolean;
  roles: UserRole[];
  rolesLoading?: boolean;
  onClose: () => void;
  onSubmit: (
    payload: CreateUserPayload,
  ) => Promise<void>;
}

interface FormState {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  roleIds: string[];
}

const INITIAL_FORM: FormState = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
  roleIds: [],
};

function getRoleLabel(name: string) {
  return name
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

export function CreateUserDialog({
  open,
  roles,
  rolesLoading = false,
  onClose,
  onSubmit,
}: CreateUserDialogProps) {
  const [form, setForm] =
    useState<FormState>(INITIAL_FORM);

  const [error, setError] =
    useState<string | null>(null);

  const [submitting, setSubmitting] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  useEffect(() => {
    if (open) {
      setForm(INITIAL_FORM);
      setError(null);
      setSubmitting(false);
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [open]);

  const passwordMismatch = useMemo(
    () =>
      Boolean(
        form.confirmPassword &&
          form.password !==
            form.confirmPassword,
      ),
    [
      form.password,
      form.confirmPassword,
    ],
  );

  function updateField(
    field: keyof FormState,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (error) {
      setError(null);
    }
  }

  function toggleRole(roleId: string) {
    setForm((current) => {
      const exists =
        current.roleIds.includes(roleId);

      return {
        ...current,
        roleIds: exists
          ? current.roleIds.filter(
              (id) => id !== roleId,
            )
          : [
              ...current.roleIds,
              roleId,
            ],
      };
    });

    if (error) {
      setError(null);
    }
  }

  function validate(): string | null {
    if (!form.firstName.trim()) {
      return "First name is required.";
    }

    if (!form.phone.trim()) {
      return "Phone number is required.";
    }

    if (!/^\d{10,20}$/.test(form.phone.trim())) {
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

    if (form.password.length < 8) {
      return "Password must be at least 8 characters.";
    }

    if (passwordMismatch) {
      return "Passwords do not match.";
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

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: CreateUserPayload = {
        firstName: form.firstName.trim(),
        lastName:
          form.lastName.trim() || undefined,
        phone: form.phone.trim(),
        email: form.email.trim(),
        password: form.password,
        roleIds: form.roleIds,
      };

      await onSubmit(payload);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create user.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
        onClick={() => {
          if (!submitting) {
            onClose();
          }
        }}
      />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Create User
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Create a platform user and assign
              their access roles.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto"
        >
          <div className="space-y-6 px-6 py-6">
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-3 text-xs text-red-700">
                <AlertCircle
                  size={16}
                  className="mt-0.5 shrink-0"
                />

                <span>{error}</span>
              </div>
            )}

            {/* Personal Information */}
            <section>
              <h3 className="text-sm font-semibold text-slate-900">
                Personal Information
              </h3>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    First Name
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(event) =>
                      updateField(
                        "firstName",
                        event.target.value,
                      )
                    }
                    placeholder="Enter first name"
                    disabled={submitting}
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Last Name
                  </label>

                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(event) =>
                      updateField(
                        "lastName",
                        event.target.value,
                      )
                    }
                    placeholder="Enter last name"
                    disabled={submitting}
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                  />
                </div>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h3 className="text-sm font-semibold text-slate-900">
                Contact Information
              </h3>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
                    value={form.phone}
                    onChange={(event) =>
                      updateField(
                        "phone",
                        event.target.value.replace(
                          /\D/g,
                          "",
                        ),
                      )
                    }
                    placeholder="9876543210"
                    disabled={submitting}
                    maxLength={20}
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
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
                    value={form.email}
                    onChange={(event) =>
                      updateField(
                        "email",
                        event.target.value,
                      )
                    }
                    placeholder="user@example.com"
                    disabled={submitting}
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                  />
                </div>
              </div>
            </section>

            {/* Password */}
            <section>
              <h3 className="text-sm font-semibold text-slate-900">
                Account Security
              </h3>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Password
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <div className="relative">
                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={form.password}
                      onChange={(event) =>
                        updateField(
                          "password",
                          event.target.value,
                        )
                      }
                      placeholder="Minimum 8 characters"
                      disabled={submitting}
                      className="h-10 w-full rounded-lg border border-slate-200 px-3 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (value) => !value,
                        )
                      }
                      className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center text-slate-400 hover:text-slate-700"
                    >
                      {showPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Confirm Password
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <div className="relative">
                    <input
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      value={
                        form.confirmPassword
                      }
                      onChange={(event) =>
                        updateField(
                          "confirmPassword",
                          event.target.value,
                        )
                      }
                      placeholder="Re-enter password"
                      disabled={submitting}
                      className={`h-10 w-full rounded-lg border px-3 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 disabled:bg-slate-50 ${
                        passwordMismatch
                          ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                          : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          (value) => !value,
                        )
                      }
                      className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center text-slate-400 hover:text-slate-700"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>

                  {passwordMismatch && (
                    <p className="mt-1 text-[11px] text-red-600">
                      Passwords do not match.
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Roles */}
            <section>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Roles & Access
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Select one or more roles for
                    this user.
                  </p>
                </div>

                {form.roleIds.length > 0 && (
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                    {form.roleIds.length} selected
                  </span>
                )}
              </div>

              <div className="mt-4 rounded-xl border border-slate-200">
                {rolesLoading ? (
                  <div className="flex items-center justify-center gap-2 px-4 py-8 text-xs text-slate-500">
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                    Loading roles...
                  </div>
                ) : roles.length === 0 ? (
                  <div className="px-4 py-8 text-center text-xs text-slate-500">
                    No roles available.
                  </div>
                ) : (
                  <div className="grid gap-2 p-3 sm:grid-cols-2">
                    {roles.map((role) => {
                      const selected =
                        form.roleIds.includes(
                          role.id,
                        );

                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() =>
                            toggleRole(
                              role.id,
                            )
                          }
                          disabled={submitting}
                          className={`flex items-center justify-between rounded-lg border px-3 py-3 text-left transition ${
                            selected
                              ? "border-blue-300 bg-blue-50"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <span>
                            <span
                              className={`block text-xs font-semibold ${
                                selected
                                  ? "text-blue-800"
                                  : "text-slate-800"
                              }`}
                            >
                              {getRoleLabel(
                                role.name,
                              )}
                            </span>

                            <span className="mt-0.5 block text-[10px] text-slate-400">
                              {role.name}
                            </span>
                          </span>

                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded border text-[11px] font-bold ${
                              selected
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-slate-300 bg-white text-transparent"
                            }`}
                          >
                            ✓
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                submitting ||
                rolesLoading ||
                roles.length === 0
              }
              className="inline-flex items-center gap-2 rounded-lg bg-[#0864ec] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting && (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              )}

              {submitting
                ? "Creating..."
                : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}