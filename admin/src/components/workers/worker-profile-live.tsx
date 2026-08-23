"use client";

import { useWorker } from "@/hooks/use-workers";
import {
  CalendarDays,
  FileCheck2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Loader2,
} from "lucide-react";

function statusClass(status?: string) {
  if (status === "VERIFIED") return "text-emerald-600";
  if (status === "FAILED" || status === "EXPIRED") return "text-red-600";
  if (status === "MANUAL_REVIEW") return "text-orange-600";
  return "text-amber-600";
}

function formatStatus(status?: string) {
  return (status || "PENDING").replaceAll("_", " ");
}

function formatDate(value?: string | null) {
  if (!value) return "Not provided";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function WorkerProfileLive({ id }: { id: string }) {
  const query = useWorker(id);

  if (query.isLoading) {
    return (
      <div className="card flex min-h-[500px] items-center justify-center gap-2 text-sm text-slate-500">
        <Loader2 className="animate-spin" size={18} />
        Loading worker profile...
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="card p-8 text-sm text-red-600">
        Unable to load this worker. Please refresh and try again.
      </div>
    );
  }

  const data = query.data;
  const user = data.user;
  const firstName = data.firstName || user?.firstName || "Worker";
  const lastName = data.lastName || user?.lastName || "";
  const phone = data.phone || user?.phone || "Not provided";
  const email = data.email || user?.email || null;
  const profileImageUrl = data.profileImageUrl || user?.profilePhotoUrl || null;

  const primarySkill =
    data.primarySkill ||
    data.skills?.[0]?.skill?.name ||
    "Not specified";

  const currentAddress =
    data.addresses?.find((address) => address.isCurrent) ||
    data.addresses?.[0];
  const city = data.city || currentAddress?.city || "Not specified";
  const state = data.state || currentAddress?.state || "Not specified";

  const verificationRequests = data.verificationRequests || [];
  const latestVerification = verificationRequests[0];

  const verificationChecks = verificationRequests.flatMap((request) =>
    (request.checks || []).map((check) => ({
      id: `${request.id}-${check.id}`,
      type: check.type,
      label: check.type.replaceAll("_", " "),
      description: "Background verification check",
      status: check.status,
      score: check.result?.score ?? null,
      remarks: check.result?.remarks ?? null,
    })),
  );

  const verifications =
    data.verifications && data.verifications.length > 0
      ? data.verifications
      : verificationChecks;

  const verificationScore =
    data.verificationScore ?? latestVerification?.overallScore ?? 0;
  const verificationStatus =
    data.verificationStatus || latestVerification?.status || "PENDING";

  return (
    <div className="card overflow-hidden">
      <div className="bg-gradient-to-r from-[#062c6f] to-[#0757d8] p-6 text-white">
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white/40 bg-slate-200 text-2xl font-bold text-slate-700">
            {profileImageUrl ? (
              <img
                src={profileImageUrl}
                alt={`${firstName} ${lastName}`}
                className="h-full w-full object-cover"
              />
            ) : (
              `${firstName[0] || "W"}${lastName[0] || ""}`
            )}
          </div>

          <div className="min-w-[240px] flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">
                {firstName} {lastName}
              </h1>
              <span className="rounded-full bg-white/15 px-2 py-1 text-[10px] font-bold">
                {verificationStatus === "VERIFIED"
                  ? "✓ Verified"
                  : formatStatus(verificationStatus)}
              </span>
            </div>
            <p className="mt-1 text-sm text-blue-100">
              {primarySkill} • {Number(data.experienceYears ?? 0)} Years Experience •
              Worker ID: {data.workerCode}
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-blue-100">
              <span className="flex items-center gap-1">
                <MapPin size={13} />
                {city}, {state}
              </span>
              <span className="flex items-center gap-1">
                <Phone size={13} />
                {phone}
              </span>
              {email && (
                <span className="flex items-center gap-1">
                  <Mail size={13} />
                  {email}
                </span>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-white/10 p-4 text-center">
            <div className="text-[10px] text-blue-100">Verification Score</div>
            <div className="text-3xl font-extrabold">
              {verificationScore}
              <span className="text-sm">/100</span>
            </div>
            <div className="text-xs text-emerald-200">
              {verificationStatus === "VERIFIED"
                ? "Highly Verified"
                : "Verification in progress"}
            </div>
          </div>
        </div>
      </div>

      <div className="flex overflow-x-auto border-b px-5">
        {["Overview", "Documents", "Employment", "Skills", "Verification", "References", "Education", "Activity"].map(
          (label, index) => (
            <button
              key={label}
              type="button"
              className={`whitespace-nowrap px-5 py-4 text-xs font-semibold ${
                index === 0
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-slate-500"
              }`}
            >
              {label}
            </button>
          ),
        )}
      </div>

      <div className="grid gap-5 p-6 xl:grid-cols-[1.25fr_.75fr]">
        <div className="space-y-5">
          <section>
            <h2 className="mb-3 text-sm font-bold">About Worker</h2>
            <div className="card p-5">
              <p className="text-xs leading-6 text-slate-600">
                {data.about || "No worker description has been added yet."}
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {[
                  ["Date of Birth", formatDate(data.dateOfBirth), CalendarDays],
                  ["Phone", phone, Phone],
                  ["Email", email || "Not provided", Mail],
                  [
                    "Languages",
                    data.languages?.join(", ") || "Not provided",
                    FileCheck2,
                  ],
                ].map(([label, value, Icon]) => {
                  const DetailIcon = Icon as typeof CalendarDays;
                  return (
                    <div key={String(label)}>
                      <div className="mb-1 flex items-center gap-2 text-[10px] text-slate-400">
                        <DetailIcon size={13} />
                        {String(label)}
                      </div>
                      <div className="text-xs font-semibold">{String(value)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-bold">Employment History</h2>
            <div className="space-y-3">
              {(data.employmentHistory || []).length === 0 && (
                <div className="card p-5 text-xs text-slate-500">
                  No employment history recorded.
                </div>
              )}

              {(data.employmentHistory || []).map((employment) => (
                <div className="card p-5" key={employment.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <b className="text-sm">{employment.companyName}</b>
                      <div className="mt-1 text-xs text-slate-500">
                        {employment.designation} • {formatDate(employment.startDate)} – {employment.currentlyWorking ? "Present" : formatDate(employment.endDate)}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold ${statusClass(
                        employment.verificationStatus,
                      )}`}
                    >
                      {formatStatus(employment.verificationStatus)}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400">Supervisor</span>
                      <div className="font-semibold">
                        {employment.supervisorName || "Not provided"}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400">Employment Check</span>
                      <div
                        className={`font-semibold ${statusClass(
                          employment.verificationStatus,
                        )}`}
                      >
                        {formatStatus(employment.verificationStatus)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div>
          <section className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold">Verification Status</h2>
              <ShieldCheck className="text-blue-600" size={20} />
            </div>

            <div className="space-y-1">
              {verifications.map((verification) => (
                <div
                  key={verification.id}
                  className="flex items-center gap-3 border-b py-4 last:border-0"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <FileCheck2 size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold">
                      {verification.label}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {verification.description || "Background verification check"}
                    </div>
                    {verification.remarks && (
                      <div className="mt-1 text-[10px] text-slate-500">
                        {verification.remarks}
                      </div>
                    )}
                  </div>
                  <span
                    className={`shrink-0 text-[10px] font-bold ${statusClass(
                      verification.status,
                    )}`}
                  >
                    {formatStatus(verification.status)} {verification.status === "VERIFIED" ? "✓" : "◷"}
                  </span>
                </div>
              ))}

              {verifications.length === 0 && (
                <div className="py-6 text-center text-xs text-slate-500">
                  No verification checks recorded.
                </div>
              )}
            </div>
          </section>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="card p-4">
              <div className="text-[10px] text-slate-400">Skills</div>
              <b className="mt-1 block text-lg">
                {data.skills?.length ?? (primarySkill !== "Not specified" ? 1 : 0)}
              </b>
            </div>
            <div className="card p-4">
              <div className="text-[10px] text-slate-400">Documents</div>
              <b className="mt-1 block text-lg">
                {data.documents?.length || 0}
              </b>
            </div>
          </div>

          {data.profileCompletion !== undefined && (
            <div className="card mt-3 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Profile Completion</span>
                <b className="text-xs">{data.profileCompletion}%</b>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{ width: `${Math.min(100, Math.max(0, data.profileCompletion))}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
