"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Plus,
  ShieldCheck,
} from "lucide-react";
import {
  FormEvent,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { AdminShell } from "@/components/layout/admin-shell";
import { useRoles } from "@/hooks/use-roles";

export default function CreateRolePage() {
  const router = useRouter();

  const { createRole } = useRoles();

  const [roleName, setRoleName] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const trimmedName =
      roleName.trim();

    const trimmedDescription =
      description.trim();

    if (!trimmedName) {
      setError(
        "Role name is required.",
      );
      return;
    }

    if (trimmedName.length > 100) {
      setError(
        "Role name must not exceed 100 characters.",
      );
      return;
    }

    if (trimmedDescription.length > 500) {
      setError(
        "Description must not exceed 500 characters.",
      );
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const role = await createRole({
        name: trimmedName,
        description:
          trimmedDescription ||
          undefined,
      });

      if (!role?.id) {
        throw new Error(
          "Role was created but no role ID was returned.",
        );
      }

      router.push(
        `/roles/${role.id}`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create role",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit =
    !submitting &&
    roleName.trim().length > 0;

  return (
    <AdminShell>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Back */}

        <Link
          href="/roles"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft size={15} />
          Back to Roles
        </Link>

        {/* Header */}

        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
            <ShieldCheck
              size={22}
              className="text-blue-600"
            />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Create Role
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Create a custom role for
              your workforce platform.
              Permissions can be
              configured after the role
              is created.
            </p>
          </div>
        </div>

        {/* Error */}

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-red-800">
                Unable to create role
              </p>

              <p className="mt-1 text-xs leading-5 text-red-700">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Form */}

        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        >
          {/* Form Header */}

          <div className="border-b border-slate-200 bg-slate-50/70 px-6 py-5">
            <h2 className="text-sm font-bold text-slate-900">
              Role Information
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Define the name and
              description for the new
              custom role.
            </p>
          </div>

          {/* Form Body */}

          <div className="space-y-6 p-6">
            {/* Role Name */}

            <div>
              <label
                htmlFor="role-name"
                className="text-sm font-semibold text-slate-800"
              >
                Role Name
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <p className="mt-1 text-xs text-slate-500">
                Enter a unique name for
                the custom role.
              </p>

              <input
                id="role-name"
                name="name"
                type="text"
                value={roleName}
                onChange={(event) =>
                  setRoleName(
                    event.target.value,
                  )
                }
                placeholder="e.g. HR Manager"
                maxLength={100}
                disabled={submitting}
                className="mt-3 block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              />

              <div className="mt-1.5 flex justify-end">
                <span className="text-[11px] text-slate-400">
                  {roleName.length}/100
                </span>
              </div>
            </div>

            {/* Description */}

            <div>
              <label
                htmlFor="role-description"
                className="text-sm font-semibold text-slate-800"
              >
                Description
              </label>

              <p className="mt-1 text-xs text-slate-500">
                Briefly describe what this
                role is responsible for.
              </p>

              <textarea
                id="role-description"
                name="description"
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value,
                  )
                }
                placeholder="e.g. Manages HR and workforce operations."
                maxLength={500}
                rows={4}
                disabled={submitting}
                className="mt-3 block w-full resize-none rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              />

              <div className="mt-1.5 flex justify-end">
                <span className="text-[11px] text-slate-400">
                  {description.length}/500
                </span>
              </div>
            </div>

            {/* Permission Information */}

            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2
                  size={18}
                  className="mt-0.5 shrink-0 text-blue-600"
                />

                <div>
                  <p className="text-sm font-semibold text-blue-900">
                    Permissions
                  </p>

                  <p className="mt-1 text-xs leading-5 text-blue-700">
                    The new custom role will
                    initially have no
                    permissions. You can
                    configure its permissions
                    from the role details page
                    after creation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
            <Link
              href="/roles"
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0864ec] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Plus size={16} />
              )}

              {submitting
                ? "Creating..."
                : "Create Role"}
            </button>
          </div>
        </form>
      </div>
    </AdminShell>
  );
}