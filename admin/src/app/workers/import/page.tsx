"use client";

import { ChangeEvent, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Download, FileUp, Loader2, UploadCloud, XCircle } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";

const HEADERS = ["workerCode","phone","email","firstName","lastName","professionCategory","profession","experienceYears","addressLine1","city","district","state","pincode"];

type Result = { imported: number; failed: number; duplicates: number; errors?: Array<{ row?: number; error?: string }> };

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  if (!lines.length) throw new Error("The CSV file is empty.");
  const header = lines[0].split(",").map(v => v.trim());
  const missing = HEADERS.filter(h => !header.includes(h));
  if (missing.length) throw new Error(`Missing columns: ${missing.join(", ")}`);
  return lines.slice(1).map(line => {
    const values: string[] = [];
    let current = "", quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { quoted = !quoted; continue; }
      if (ch === "," && !quoted) { values.push(current.trim()); current = ""; } else current += ch;
    }
    values.push(current.trim());
    return Object.fromEntries(header.map((h, i) => [h, values[i] || ""])) as Record<string,string>;
  }).filter(row => Object.values(row).some(Boolean)).map(row => ({ ...row, experienceYears: row.experienceYears ? Number(row.experienceYears) : 0 }));
}

export default function WorkerImportPage() {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name); setError(null); setResult(null);
    try { setRows(parseCsv(await file.text())); } catch (e) { setRows([]); setError(e instanceof Error ? e.message : "Unable to read CSV"); }
  }

  async function upload() {
    if (!rows.length) return setError("Select a CSV containing at least one worker.");
    if (rows.length > 5000) return setError("A single import can contain at most 5,000 workers.");
    setUploading(true); setError(null); setResult(null);
    try {
      const response = await fetch("/api/backend/admin/workers/import", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(Array.isArray(data?.message) ? data.message.join(", ") : data?.message || "Import failed");
      setResult({ imported: Number(data?.imported ?? data?.success ?? 0), failed: Number(data?.failed ?? 0), duplicates: Number(data?.duplicates ?? 0), errors: data?.errors || [] });
    } catch (e) { setError(e instanceof Error ? e.message : "Import failed"); }
    finally { setUploading(false); }
  }

  const preview = useMemo(() => rows.slice(0, 5), [rows]);

  return <AdminShell>
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div><Link href="/workers" className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600"><ArrowLeft size={14}/> Workers</Link><h1 className="text-2xl font-bold text-slate-900">Import Workers</h1><p className="mt-1 text-sm text-slate-500">Bulk-load the workforce supplied by your operations team or external feed.</p></div>
        <a href="/api/backend/admin/workers/import/template" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Download size={16}/> Download CSV Template</a>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-10 text-center">
            <UploadCloud className="mx-auto text-blue-500" size={36}/><h2 className="mt-3 text-base font-bold text-slate-900">Upload worker CSV</h2><p className="mt-1 text-xs text-slate-500">Use the official template. Maximum 5,000 workers per import.</p>
            <label className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#0864ec] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"><FileUp size={16}/> Choose CSV<input type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden"/></label>
            {fileName && <p className="mt-3 text-xs font-semibold text-slate-600">{fileName} · {rows.length} rows detected</p>}
          </div>

          {error && <div className="mt-4 flex gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-xs text-red-700"><XCircle size={16}/>{error}</div>}

          {preview.length > 0 && <div className="mt-5 overflow-x-auto rounded-lg border border-slate-200"><div className="border-b bg-slate-50 px-4 py-3 text-xs font-bold text-slate-700">Preview — first {preview.length} rows</div><table className="min-w-full text-left text-xs"><thead><tr className="border-b">{["workerCode","firstName","phone","profession","city","state"].map(h => <th key={h} className="px-4 py-2 font-semibold text-slate-500">{h}</th>)}</tr></thead><tbody>{preview.map((row, i) => <tr key={i} className="border-b last:border-0"><td className="px-4 py-2">{String(row.workerCode || "-")}</td><td className="px-4 py-2">{String(row.firstName || "-")} {String(row.lastName || "")}</td><td className="px-4 py-2">{String(row.phone || "-")}</td><td className="px-4 py-2">{String(row.profession || "-")}</td><td className="px-4 py-2">{String(row.city || "-")}</td><td className="px-4 py-2">{String(row.state || "-")}</td></tr>)}</tbody></table></div>}

          <div className="mt-5 flex justify-end"><button disabled={uploading || !rows.length} onClick={upload} className="inline-flex items-center gap-2 rounded-lg bg-[#0864ec] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40">{uploading ? <Loader2 size={16} className="animate-spin"/> : <FileUp size={16}/>} {uploading ? "Importing..." : `Import ${rows.length || ""} Workers`}</button></div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5"><h3 className="text-sm font-bold text-slate-900">Import workflow</h3><ol className="mt-4 space-y-4 text-xs text-slate-600"><li><b className="text-slate-900">1. Prepare</b><br/>Download the template and fill worker records.</li><li><b className="text-slate-900">2. Validate</b><br/>Required fields, duplicates, category and location are checked.</li><li><b className="text-slate-900">3. Import</b><br/>Valid workers are created with verification status Pending.</li><li><b className="text-slate-900">4. Verify</b><br/>Start Aadhaar and background verification from Worker Master.</li></ol></div>
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-5"><p className="text-xs font-bold text-blue-900">Important</p><p className="mt-1 text-xs leading-5 text-blue-800">Do not include worker contact details in employer-facing exports. Contact data is protected and can only be unlocked through the employer credit wallet.</p></div>
        </aside>
      </div>

      {result && <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-5"><div className="flex items-center gap-2 text-sm font-bold text-emerald-800"><CheckCircle2 size={18}/> Import completed</div><div className="mt-3 grid gap-3 sm:grid-cols-3"><div><p className="text-[11px] text-emerald-700">Imported</p><p className="text-xl font-bold text-emerald-900">{result.imported}</p></div><div><p className="text-[11px] text-emerald-700">Duplicates</p><p className="text-xl font-bold text-emerald-900">{result.duplicates}</p></div><div><p className="text-[11px] text-emerald-700">Failed</p><p className="text-xl font-bold text-emerald-900">{result.failed}</p></div></div>{result.errors?.length ? <div className="mt-4 rounded-lg bg-white p-3 text-xs text-red-700">{result.errors.slice(0, 10).map((e, i) => <div key={i}>Row {e.row ?? "-"}: {e.error ?? "Validation failed"}</div>)}</div> : null}<Link href="/workers" className="mt-4 inline-block text-xs font-bold text-blue-700">View Worker Master →</Link></div>}
    </div>
  </AdminShell>;
}
