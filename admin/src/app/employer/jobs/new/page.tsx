"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, BriefcaseBusiness, Plus, X } from "lucide-react";
import { EmployerShell } from "@/components/layout/employer-shell";

const PROFESSIONS = [
  "Parotta Master", "Tea Master", "Cook", "Baker", "Kitchen Helper",
  "Mechanic", "Bike Mechanic", "Electrician", "Plumber", "Mason",
  "Painter", "Carpenter", "Driver", "Delivery Worker", "Cleaner",
  "Housekeeping Worker", "Factory Worker", "Packing Worker", "Tailor",
  "Security Guard", "Farm Worker", "Shop Worker", "General Labour", "Other",
];

const WORK_TYPES = ["FULL_TIME", "PART_TIME", "DAILY_WAGE", "CONTRACT"];
const SALARY_TYPES = ["MONTHLY", "DAILY", "HOURLY"];

export default function CreateEmployerJobPage() {
  const [form, setForm] = useState({
    title: "", description: "", city: "", district: "", state: "Tamil Nadu", pincode: "",
    salaryMin: "", salaryMax: "", salaryType: "MONTHLY", openings: "1", startDate: "",
    profession: "", workType: "FULL_TIME", skills: [] as string[], skillInput: "",
  });
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function addSkill() {
    const value = form.skillInput.trim();
    if (!value || form.skills.some((skill) => skill.toLowerCase() === value.toLowerCase())) return;
    update("skills", [...form.skills, value]);
    update("skillInput", "");
  }

  function removeSkill(skill: string) {
    update("skills", form.skills.filter((item) => item !== skill));
  }

  async function submit(publish: boolean) {
    setError(null); setSuccess(null);
    if (!form.title.trim() || !form.description.trim() || !form.city.trim() || !form.state.trim()) {
      setError("Title, description, city and state are required."); return;
    }
    if (publish && form.skills.length === 0) {
      setError("Add at least one required skill before publishing."); return;
    }
    setSaving(!publish); setPublishing(publish);
    try {
      const response = await fetch("/api/backend/jobs/employer", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(), description: form.description.trim(), city: form.city.trim(),
          district: form.district.trim() || undefined, state: form.state.trim(), pincode: form.pincode.trim() || undefined,
          salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
          salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
          salaryType: form.salaryType, openings: Number(form.openings) || 1,
          startDate: form.startDate || undefined, skillNames: [form.profession, ...form.skills].filter(Boolean),
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || "Unable to create job");
      if (publish) {
        const jobId = data?.id;
        if (!jobId) throw new Error("Job was created but its ID was not returned");
        const publishResponse = await fetch(`/api/backend/jobs/employer/${jobId}/publish`, { method: "POST", credentials: "include" });
        const publishData = await publishResponse.json().catch(() => null);
        if (!publishResponse.ok) throw new Error(publishData?.message || "Job saved as draft but could not be published");
        setSuccess("Job published successfully. It is now available to matching workers.");
      } else {
        setSuccess("Job saved as draft successfully.");
      }
      if (publish) window.setTimeout(() => { window.location.href = "/employer/jobs"; }, 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save job");
    } finally { setSaving(false); setPublishing(false); }
  }

  return (
    <EmployerShell>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/employer/jobs" className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"><ArrowLeft size={17} /></Link>
        <div><h1 className="text-2xl font-bold text-slate-900">Create Job</h1><p className="mt-1 text-xs text-slate-500">Find the right blue-collar worker for your opening.</p></div>
      </div>

      <div className="max-w-4xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-blue-50 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white"><BriefcaseBusiness size={20} className="text-[#0864ec]" /></div><div><div className="text-sm font-bold text-slate-900">What worker do you need?</div><div className="text-xs text-slate-500">No degree required. Focus on practical work and experience.</div></div></div>

        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {success && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Profession" required><select value={form.profession} onChange={(e) => update("profession", e.target.value)} className="input"><option value="">Select profession</option>{PROFESSIONS.map((item) => <option key={item}>{item}</option>)}</select></Field>
          <Field label="Job title" required><input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="e.g. Experienced Parotta Master" className="input" /></Field>
          <Field label="City" required><input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Thanjavur" className="input" /></Field>
          <Field label="District"><input value={form.district} onChange={(e) => update("district", e.target.value)} placeholder="Thanjavur" className="input" /></Field>
          <Field label="State" required><input value={form.state} onChange={(e) => update("state", e.target.value)} className="input" /></Field>
          <Field label="Pincode"><input value={form.pincode} onChange={(e) => update("pincode", e.target.value)} placeholder="613001" className="input" /></Field>
          <Field label="Minimum salary"><input type="number" min="0" value={form.salaryMin} onChange={(e) => update("salaryMin", e.target.value)} placeholder="18000" className="input" /></Field>
          <Field label="Maximum salary"><input type="number" min="0" value={form.salaryMax} onChange={(e) => update("salaryMax", e.target.value)} placeholder="25000" className="input" /></Field>
          <Field label="Salary type"><select value={form.salaryType} onChange={(e) => update("salaryType", e.target.value)} className="input">{SALARY_TYPES.map((item) => <option key={item}>{item}</option>)}</select></Field>
          <Field label="Workers required"><input type="number" min="1" value={form.openings} onChange={(e) => update("openings", e.target.value)} className="input" /></Field>
          <Field label="Work type"><select value={form.workType} onChange={(e) => update("workType", e.target.value)} className="input">{WORK_TYPES.map((item) => <option key={item}>{item.replace("_", " ")}</option>)}</select></Field>
          <Field label="Start date"><input type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} className="input" /></Field>
        </div>

        <div className="mt-5"><Field label="Description" required><textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={5} placeholder="Describe the work, timings, workplace and anything the worker should know." className="input resize-none" /></Field></div>

        <div className="mt-5"><Field label="Required skills" required><div className="flex gap-2"><input value={form.skillInput} onChange={(e) => update("skillInput", e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }} placeholder="e.g. South Indian cooking" className="input" /><button type="button" onClick={addSkill} className="shrink-0 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white"><Plus size={16} /></button></div><div className="mt-3 flex flex-wrap gap-2">{[...new Set([form.profession, ...form.skills].filter(Boolean))].map((skill) => <span key={skill} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">{skill}{skill !== form.profession && <button type="button" onClick={() => removeSkill(skill)}><X size={13} /></button>}</span>)}</div></Field></div>

        <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end"><Link href="/employer/jobs" className="rounded-lg border border-slate-200 px-5 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</Link><button disabled={saving || publishing} onClick={() => void submit(false)} className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-800 disabled:opacity-50">{saving ? "Saving..." : "Save Draft"}</button><button disabled={saving || publishing} onClick={() => void submit(true)} className="rounded-lg bg-[#0864ec] px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{publishing ? "Publishing..." : "Publish Job"}</button></div>
      </div>
      <style jsx>{`.input{width:100%;border:1px solid #e2e8f0;border-radius:.5rem;padding:.65rem .75rem;font-size:.875rem;color:#0f172a;background:#fff;outline:none}.input:focus{border-color:#0864ec;box-shadow:0 0 0 2px rgba(8,100,236,.1)}`}</style>
    </EmployerShell>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">{label}{required && <span className="ml-1 text-red-500">*</span>}</span>{children}</label>;
}
