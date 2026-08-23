"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Search,
  ShieldAlert,
  Users,
  X,
} from "lucide-react";

import { AdminShell } from "@/components/layout/admin-shell";

type EmployerStatus = "PENDING" | "VERIFIED" | "SUSPENDED";

interface Employer {
  id: string;
  companyName: string;
  companyType?: string | null;
  registrationNo?: string | null;
  gstNumber?: string | null;
  description?: string | null;
  status: EmployerStatus;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName?: string | null;
    phone: string;
    email?: string | null;
    status: string;
  };
  _count?: {
    jobs: number;
  };
}

interface EmployerForm {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  companyName: string;
  companyType: string;
  registrationNo: string;
  gstNumber: string;
  description: string;
}

const EMPTY_FORM: EmployerForm = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  password: "",
  companyName: "",
  companyType: "",
  registrationNo: "",
  gstNumber: "",
  description: "",
};

const PAGE_SIZE = 10;

function statusLabel(status: EmployerStatus) {
  if (status === "VERIFIED") return "Verified";
  if (status === "SUSPENDED") return "Suspended";
  return "Pending";
}

function StatusBadge({ status }: { status: EmployerStatus }) {
  const styles =
    status === "VERIFIED"
      ? "bg-emerald-50 text-emerald-700"
      : status === "SUSPENDED"
        ? "bg-red-50 text-red-700"
        : "bg-amber-50 text-amber-700";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {statusLabel(status)}
    </span>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function EmployersPage() {
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<EmployerForm>(EMPTY_FORM);

  const fetchEmployers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });

      if (search) params.set("search", search);
      if (status) params.set("status", status);

      const response = await fetch(`/api/employers?${params.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Unable to load employers");
      }

      setEmployers(Array.isArray(data?.data) ? data.data : []);
      setTotal(Number(data?.meta?.total ?? 0));
      setTotalPages(Math.max(Number(data?.meta?.totalPages ?? 1), 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load employers");
      setEmployers([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    void fetchEmployers();
  }, [fetchEmployers]);

  const verifiedCount = useMemo(
    () => employers.filter((employer) => employer.status === "VERIFIED").length,
    [employers],
  );

  const pendingCount = useMemo(
    () => employers.filter((employer) => employer.status === "PENDING").length,
    [employers],
  );

  function updateForm(field: keyof EmployerForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    if (formError) setFormError(null);
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setCreateOpen(true);
  }

  function closeCreate() {
    if (!saving) setCreateOpen(false);
  }

  function applySearch() {
    setPage(1);
    setSearch(searchInput.trim());
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.firstName.trim()) return setFormError("Contact first name is required.");
    if (!/^\d{10,20}$/.test(form.phone.trim())) return setFormError("Phone number must contain 10 to 20 digits.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setFormError("Please enter a valid email address.");
    if (form.password.length < 8) return setFormError("Password must be at least 8 characters.");
    if (!form.companyName.trim()) return setFormError("Company name is required.");

    setSaving(true);
    setFormError(null);

    try {
      const response = await fetch("/api/employers", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim() || undefined,
          phone: form.phone.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          companyName: form.companyName.trim(),
          companyType: form.companyType.trim() || undefined,
          registrationNo: form.registrationNo.trim() || undefined,
          gstNumber: form.gstNumber.trim() || undefined,
          description: form.description.trim() || undefined,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = Array.isArray(data?.message)
          ? data.message.join(", ")
          : data?.message || "Unable to create employer";
        throw new Error(message);
      }

      setCreateOpen(false);
      setForm(EMPTY_FORM);
      setPage(1);
      setSearch("");
      setSearchInput("");
      await fetchEmployers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to create employer");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell>
      <div className="min-h-screen bg-slate-50">
        <main className="ml-[238px] min-h-screen">
          <div className="border-b border-slate-200 bg-white">
            <div className="flex items-center justify-between px-8 py-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Employers</h1>
                <p className="mt-1 text-sm text-slate-500">Create and manage businesses that hire blue-collar workers.</p>
              </div>

              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0864ec] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <Plus size={17} />
                Add Employer
              </button>
            </div>
          </div>

          <div className="px-8 py-6">
            <div className="mb-5 grid gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-medium text-slate-500">Total Employers</p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-2xl font-bold text-slate-900">{total}</p>
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Building2 size={19} /></span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-medium text-slate-500">Verified on page</p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-2xl font-bold text-slate-900">{verifiedCount}</p>
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><CheckCircle2 size={19} /></span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-medium text-slate-500">Pending on page</p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-2xl font-bold text-slate-900">{pendingCount}</p>
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600"><ShieldAlert size={19} /></span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-medium text-slate-500">Jobs on page</p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-2xl font-bold text-slate-900">{employers.reduce((sum, employer) => sum + (employer._count?.jobs ?? 0), 0)}</p>
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600"><Users size={19} /></span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white">
              <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") applySearch();
                    }}
                    placeholder="Search company, contact, email, GST..."
                    className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <select
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value);
                    setPage(1);
                  }}
                  className="h-10 rounded-lg border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-blue-500"
                >
                  <option value="">All statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>

                <button
                  type="button"
                  onClick={applySearch}
                  className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Search
                </button>
              </div>

              {error && (
                <div className="m-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">{error}</div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200">
                      <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Company</th>
                      <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Contact</th>
                      <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Business details</th>
                      <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Jobs</th>
                      <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Status</th>
                      <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={6} className="px-5 py-16 text-center text-sm text-slate-500"><span className="inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Loading employers...</span></td></tr>
                    ) : employers.length === 0 ? (
                      <tr><td colSpan={6} className="px-5 py-16 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><Building2 size={22} /></div><p className="mt-3 text-sm font-semibold text-slate-900">No employers found</p><p className="mt-1 text-xs text-slate-500">Create your first employer using the Add Employer button.</p></td></tr>
                    ) : (
                      employers.map((employer) => (
                        <tr key={employer.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Building2 size={17} /></div>
                              <div><p className="text-sm font-semibold text-slate-900">{employer.companyName}</p><p className="text-xs text-slate-500">{employer.companyType || "Business"}</p></div>
                            </div>
                          </td>
                          <td className="px-5 py-4"><p className="text-sm font-medium text-slate-800">{[employer.user.firstName, employer.user.lastName].filter(Boolean).join(" ")}</p><p className="text-xs text-slate-500">{employer.user.phone}</p><p className="text-xs text-slate-500">{employer.user.email || "-"}</p></td>
                          <td className="px-5 py-4"><p className="text-xs text-slate-600">Registration: {employer.registrationNo || "-"}</p><p className="mt-1 text-xs text-slate-600">GST: {employer.gstNumber || "-"}</p></td>
                          <td className="px-5 py-4 text-sm font-semibold text-slate-800">{employer._count?.jobs ?? 0}</td>
                          <td className="px-5 py-4"><StatusBadge status={employer.status} /></td>
                          <td className="px-5 py-4 text-xs text-slate-500">{formatDate(employer.createdAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
                <p className="text-xs text-slate-500">Page {page} of {totalPages} · {total} employer{total === 1 ? "" : "s"}</p>
                <div className="flex items-center gap-2">
                  <button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(current - 1, 1))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={16} /></button>
                  <button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(current + 1, totalPages))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight size={16} /></button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" onClick={closeCreate} />
          <div className="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div><h2 className="text-lg font-bold text-slate-900">Create Employer</h2><p className="mt-1 text-xs text-slate-500">Create the employer account and business profile together.</p></div>
              <button type="button" onClick={closeCreate} disabled={saving} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"><X size={18} /></button>
            </div>

            <form onSubmit={handleCreate} className="overflow-y-auto">
              <div className="space-y-6 px-6 py-6">
                {formError && <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">{formError}</div>}

                <section>
                  <h3 className="text-sm font-semibold text-slate-900">Employer contact</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {([
                      ["firstName", "First name *", "Contact first name"],
                      ["lastName", "Last name", "Contact last name"],
                      ["phone", "Phone number *", "9876543210"],
                      ["email", "Email address *", "owner@company.com"],
                    ] as const).map(([field, label, placeholder]) => (
                      <div key={field}>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</label>
                        <input type={field === "email" ? "email" : field === "phone" ? "tel" : "text"} inputMode={field === "phone" ? "numeric" : undefined} value={form[field]} onChange={(event) => updateForm(field, field === "phone" ? event.target.value.replace(/\D/g, "") : event.target.value)} placeholder={placeholder} disabled={saving} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50" />
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-slate-900">Account security</h3>
                  <div className="mt-4">
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">Temporary password *</label>
                    <input type="password" value={form.password} onChange={(event) => updateForm("password", event.target.value)} placeholder="Minimum 8 characters" disabled={saving} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50" />
                    <p className="mt-1 text-[11px] text-slate-500">The employer can use this account to sign in and manage jobs later.</p>
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-slate-900">Business profile</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {([
                      ["companyName", "Company / business name *", "ABC Catering Services"],
                      ["companyType", "Business type", "Restaurant / Contractor / Shop"],
                      ["registrationNo", "Registration number", "Optional"],
                      ["gstNumber", "GST number", "Optional"],
                    ] as const).map(([field, label, placeholder]) => (
                      <div key={field}>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</label>
                        <input value={form[field]} onChange={(event) => updateForm(field, event.target.value)} placeholder={placeholder} disabled={saving} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">Business description</label>
                    <textarea value={form.description} onChange={(event) => updateForm("description", event.target.value)} placeholder="Tell us briefly about the business and the type of workers it hires." disabled={saving} rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50" />
                  </div>
                </section>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
                <button type="button" onClick={closeCreate} disabled={saving} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#0864ec] px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{saving && <Loader2 size={16} className="animate-spin" />} Create Employer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
