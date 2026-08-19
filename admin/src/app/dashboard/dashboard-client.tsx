"use client";

import {
  Users,
  Building2,
  BriefcaseBusiness,
  BadgeCheck,
  CheckCircle2,
} from "lucide-react";

import { StatCard } from "@/components/dashboard/stat-card";

import {
  RegistrationChart,
  VerificationDonut,
} from "@/components/dashboard/charts";

import { useDashboard } from "@/hooks/use-dashboard";

export default function DashboardClient() {
  const {
    data,
    isLoading,
    isError,
    error,
  } = useDashboard();

  /*
   * Loading state
   */
  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-sm text-slate-500">
          Loading dashboard...
        </div>
      </div>
    );
  }

  /*
   * Error state
   */
  if (isError || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <h2 className="text-sm font-bold text-red-700">
          Unable to load dashboard
        </h2>

        <p className="mt-1 text-xs text-red-600">
          {error instanceof Error
            ? error.message
            : "Something went wrong while loading dashboard data."}
        </p>
      </div>
    );
  }

  const {
    stats,
    recentWorkers,
    recentVerifications,
    verificationOverview,
    registrations,
  } = data;

  return (
    <>
      {/* =========================================================
          Dashboard Statistics
      ========================================================= */}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Total Workers"
          value={stats.totalWorkers.toLocaleString()}
          Icon={Users}
        />

        <StatCard
          title="Verified Workers"
          value={stats.verifiedWorkers.toLocaleString()}
          Icon={BadgeCheck}
          tone="green"
        />

        <StatCard
          title="Total Employers"
          value={stats.totalEmployers.toLocaleString()}
          Icon={Building2}
          tone="blue"
        />

        <StatCard
          title="Active Jobs"
          value={stats.activeJobs.toLocaleString()}
          Icon={BriefcaseBusiness}
          tone="orange"
        />

        <StatCard
          title="Jobs Completed"
          value={stats.completedJobs.toLocaleString()}
          Icon={CheckCircle2}
          tone="purple"
        />
      </div>

      {/* =========================================================
          Registration + Verification Overview
      ========================================================= */}

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_1fr]">
        {/* New Registrations */}
        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold">
              New Registrations
            </h2>

            <select className="rounded-md border px-3 py-1.5 text-xs">
              <option>This Month</option>
              <option>Last Month</option>
            </select>
          </div>

          <RegistrationChart
            data={registrations}
          />

          <div className="mt-1 flex justify-between text-[10px] text-slate-400">
            {registrations.length > 0 ? (
              <>
                <span>
                  {formatChartDate(
                    registrations[0]?.date,
                  )}
                </span>

                <span>
                  {formatChartDate(
                    registrations[
                      Math.floor(
                        registrations.length / 3,
                      )
                    ]?.date,
                  )}
                </span>

                <span>
                  {formatChartDate(
                    registrations[
                      Math.floor(
                        (registrations.length * 2) /
                          3,
                      )
                    ]?.date,
                  )}
                </span>

                <span>
                  {formatChartDate(
                    registrations[
                      registrations.length - 1
                    ]?.date,
                  )}
                </span>
              </>
            ) : (
              <>
                <span>-</span>
                <span>-</span>
                <span>-</span>
                <span>-</span>
              </>
            )}
          </div>
        </section>

        {/* Verification Overview */}
        <section className="card p-5">
          <h2 className="mb-5 text-sm font-bold">
            Verification Status Overview
          </h2>

          <VerificationDonut
            data={verificationOverview}
          />
        </section>
      </div>

      {/* =========================================================
          Recent Workers + Recent Verifications
      ========================================================= */}

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_1fr]">
        {/* Recent Workers */}
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b p-5">
            <h2 className="text-sm font-bold">
              Recent Workers
            </h2>

            <a
              href="/workers"
              className="text-xs font-semibold text-blue-600"
            >
              View All
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] text-slate-500">
                <tr>
                  <th className="px-5 py-3">
                    Worker
                  </th>

                  <th>
                    Skills
                  </th>

                  <th>
                    Experience
                  </th>

                  <th>
                    Verification
                  </th>

                  <th>
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {recentWorkers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-10 text-center text-xs text-slate-400"
                    >
                      No recent workers found.
                    </td>
                  </tr>
                ) : (
                  recentWorkers.map(
                    (worker) => (
                      <tr
                        key={worker.id}
                        className="border-t"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-200 text-center leading-8 font-bold">
                              {worker.name
                                ?.charAt(0)
                                ?.toUpperCase() ||
                                "?"}
                            </div>

                            <div>
                              <b>
                                {worker.name}
                              </b>

                              <div className="text-[10px] text-slate-400">
                                {worker.phone ||
                                  "-"}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>
                          {worker.skill ||
                            "-"}
                        </td>

                        <td>
                          {worker.experienceYears !==
                          null
                            ? `${worker.experienceYears} Years`
                            : "-"}
                        </td>

                        <td className="font-semibold">
                          {worker.verificationStatus ||
                            "-"}
                        </td>

                        <td>
                          <span
                            className={`rounded-full px-2 py-1 text-[9px] font-bold ${
                              worker.verificationStatus ===
                              "VERIFIED"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-blue-50 text-blue-700"
                            }`}
                          >
                            {worker.verificationStatus ||
                              "-"}
                          </span>
                        </td>
                      </tr>
                    ),
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recent Verifications */}
        <section className="card">
          <div className="flex items-center justify-between border-b p-5">
            <h2 className="text-sm font-bold">
              Recent Verifications
            </h2>

            <a
              href="/verification"
              className="text-xs font-semibold text-blue-600"
            >
              View All
            </a>
          </div>

          <div className="divide-y">
            {recentVerifications.length ===
            0 ? (
              <div className="p-5 text-center text-xs text-slate-400">
                No recent verifications found.
              </div>
            ) : (
              recentVerifications.map(
                (verification) => (
                  <div
                    key={verification.id}
                    className="flex items-center gap-3 p-4"
                  >
                    <div className="h-9 w-9 rounded-full bg-slate-200 text-center leading-9 text-xs font-bold">
                      {verification.workerName
                        ?.charAt(0)
                        ?.toUpperCase() ||
                        "?"}
                    </div>

                    <div className="flex-1">
                      <b className="text-xs">
                        {
                          verification.workerName
                        }
                      </b>

                      <div className="text-[10px] text-slate-500">
                        {verification.workerCode}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[9px] text-slate-400">
                        {formatDateTime(
                          verification.createdAt,
                        )}
                      </div>

                      <span
                        className={`text-[10px] font-semibold ${
                          verification.status ===
                          "VERIFIED"
                            ? "text-emerald-600"
                            : verification.status ===
                                "REJECTED"
                              ? "text-red-600"
                              : "text-amber-600"
                        }`}
                      >
                        {
                          verification.status
                        }
                      </span>
                    </div>
                  </div>
                ),
              )
            )}
          </div>
        </section>
      </div>
    </>
  );
}

/* =========================================================
   Helpers
========================================================= */

function formatChartDate(
  date?: string,
): string {
  if (!date) {
    return "-";
  }

  const parsedDate =
    new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime(),
    )
  ) {
    return date;
  }

  return parsedDate.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
    },
  );
}

function formatDateTime(
  date?: string,
): string {
  if (!date) {
    return "-";
  }

  const parsedDate =
    new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime(),
    )
  ) {
    return date;
  }

  return parsedDate.toLocaleString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    },
  );
}