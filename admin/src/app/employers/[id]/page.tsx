"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Building2, CheckCircle2, Loader2, ShieldAlert, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";

type EmployerStatus = "PENDING" | "VERIFIED" | "SUSPENDED";

type Employer = {
  id: string;
  companyName: string;
  companyType?: string | null;
  registrationNo?: string | null;
  gstNumber?: string | null;
  description?: string | null;
  status: EmployerStatus;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName?: string | null;
    phone: string;
    email?: string | null;
    status: string;
  };
  _count?: { jobs: number };
};

function StatusBadge({ status }: { status: EmployerStatus }) {
  const styles =
    status === "VERIFIED"
      ? "bg-emerald-50 text-emerald-700"
      : status === "SUSPENDED"
        ? "bg-red-50 text-red-700"
        : "bg-amber-50 text-amber-700";
  const label = status === "VERIFIED" ? "Verified" : status === "SUSPENDED" ? "Suspended" : "Pending";

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${styles}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

export default function EmployerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [employer, setEmployer] = useState<Employer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const { id } = await params;
      try {
        const response = await fetch(`/api/employers/${id}`, { credentials: "include", cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data?.message || "Unable to load employer");
        if (active) setEmployer(data);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to load employer");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => { active = false; };
  }, [params]);

  async function changeStatus(status: "VERIFIED" | "SUSPENDED") {
    if (!employer) return;
    const message = status === "VERIFIED"
      ? "Verify and activate this employer?"
      : "Suspend this employer? They will no longer be able to log in.";

    if (!window.confirm(message)) return;

    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/employers/${employer.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = Array.isArray(data?.message) ? data.message.join(", ") : data?.message || "Unable to update employer";
        throw new Error(message);
      }
      setEmployer(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update employer");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell>
      <div className="min-h-screen bg-slate-50">
        <main className="ml-[238px] min-h-screen">
          <div className="border-b border-slate-200 bg-white">
            <div className="flex items-center gap-4 px-8 py-6">
              <button type="button" onClick={() => router.push("/employers")} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                <ArrowLeft size={19} />
              </button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Employer Details</h1>
                <p className="mt-1 text-sm text-slate-500">Review the business before activating access.</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-6">
            {loading ? (
              <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-500"><Loader2 className="mx-auto mb-2 animate-spin" size={20} />Loading employer...</div>
            ) : error ? (
              <div className="rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div>
            ) : employer ? (
              <>
                <div className="rounded-xl border border-slate-200 bg-white p-6">
                  <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Building2 size={27} /></div>
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-xl font-bold text-slate-900">{employer.companyName}</h2>
                          <StatusBadge status={employer.status} />
                        </div>
                        <p className="mt-1 text-sm text-slate-500">{employer.companyType || "Business"}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {employer.status !== "VERIFIED" && (
                        <button disabled={saving} type="button" onClick={() => void changeStatus("VERIFIED")} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
                          <CheckCircle2 size={16} /> Verify & Activate
                        </button>
                      )}
                      {employer.status !== "SUSPENDED" && (
                        <button disabled={saving} type="button" onClick={() => void changeStatus("SUSPENDED")} className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60">
                          <ShieldAlert size={16} /> Suspend
                        </button>
                      )}
                    </div>
                  </div>

                  {saving && <p className="mt-4 text-xs text-slate-500">Updating employer status...</p>}
                </div>

                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  <section className="rounded-xl border border-slate-200 bg-white p-6">
                    <div className="mb-5 flex items-center gap-2"><UserRound size={18} className="text-blue-600" /><h3 className="font-semibold text-slate-900">Contact Person</h3></div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div><p className="text-xs text-slate-500">Name</p><p className="mt-1 text-sm font-medium text-slate-900">{[employer.user.firstName, employer.user.lastName].filter(Boolean).join(" ")}</p></div>
                      <div><p className="text-xs text-slate-500">Account status</p><p className="mt-1 text-sm font-medium text-slate-900">{employer.user.status}</p></div>
                      <div><p className="text-xs text-slate-500">Phone</p><p className="mt-1 text-sm font-medium text-slate-900">{employer.user.phone}</p></div>
                      <div><p className="text-xs text-slate-500">Email</p><p className="mt-1 break-all text-sm font-medium text-slate-900">{employer.user.email || "-"}</p></div>
                    </div>
                  </section>

                  <section className="rounded-xl border border-slate-200 bg-white p-6">
                    <div className="mb-5 flex items-center gap-2"><Building2 size={18} className="text-blue-600" /><h3 className="font-semibold text-slate-900">Business Information</h3></div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div><p className="text-xs text-slate-500">Registration number</p><p className="mt-1 text-sm font-medium text-slate-900">{employer.registrationNo || "-"}</p></div>
                      <div><p className="text-xs text-slate-500">GST number</p><p className="mt-1 text-sm font-medium text-slate-900">{employer.gstNumber || "-"}</p></div>
                      <div><p className="text-xs text-slate-500">Jobs</p><p className="mt-1 text-sm font-medium text-slate-900">{employer._count?.jobs ?? 0}</p></div>
                      <div><p className="text-xs text-slate-500">Employer ID</p><p className="mt-1 break-all text-xs font-medium text-slate-700">{employer.id}</p></div>
                    </div>
                  </section>
                </div>

                <section className="mt-5 rounded-xl border border-slate-200 bg-white p-6">
                  <h3 className="font-semibold text-slate-900">Business Description</h3>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{employer.description || "No description provided."}</p>
                </section>
              </>
            ) : null}
          </div>
        </main>
      </div>
    </AdminShell>
  );
}
