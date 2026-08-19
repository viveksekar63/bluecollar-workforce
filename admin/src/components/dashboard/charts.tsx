"use client";

import { useEffect, useRef } from "react";

import type {
  RegistrationPoint,
  VerificationOverview,
} from "@/types/dashboard";

/* =========================================================
   Registration Chart
========================================================= */

interface RegistrationChartProps {
  data: RegistrationPoint[];
}

export function RegistrationChart({
  data,
}: RegistrationChartProps) {
  const ref =
    useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;

    if (!canvas) {
      return;
    }

    const ctx =
      canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    const width =
      canvas.clientWidth;

    const height =
      canvas.clientHeight;

    if (!width || !height) {
      return;
    }

    /*
     * Handle high-DPI displays.
     */
    const devicePixelRatio =
      window.devicePixelRatio || 1;

    canvas.width =
      width * devicePixelRatio;

    canvas.height =
      height * devicePixelRatio;

    ctx.setTransform(
      devicePixelRatio,
      0,
      0,
      devicePixelRatio,
      0,
      0,
    );

    /*
     * Clear canvas.
     */
    ctx.clearRect(
      0,
      0,
      width,
      height,
    );

    /*
     * No data.
     */
    if (!data.length) {
      ctx.fillStyle = "#94a3b8";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.fillText(
        "No registration data available",
        width / 2,
        height / 2,
      );

      return;
    }

    /*
     * Extract registration counts.
     */
    const values =
      data.map(
        (item) => item.count,
      );

    const maxValue =
      Math.max(...values, 1);

    const minValue =
      Math.min(...values, 0);

    /*
     * Chart padding.
     */
    const paddingLeft = 12;
    const paddingRight = 12;
    const paddingTop = 12;
    const paddingBottom = 18;

    const chartWidth =
      width -
      paddingLeft -
      paddingRight;

    const chartHeight =
      height -
      paddingTop -
      paddingBottom;

    /*
     * Draw horizontal grid lines.
     */
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;

    const gridLines = 4;

    for (
      let i = 0;
      i <= gridLines;
      i++
    ) {
      const y =
        paddingTop +
        (i / gridLines) *
          chartHeight;

      ctx.beginPath();

      ctx.moveTo(
        paddingLeft,
        y,
      );

      ctx.lineTo(
        width - paddingRight,
        y,
      );

      ctx.stroke();
    }

    /*
     * Draw registration line.
     */
    ctx.strokeStyle = "#1769ff";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    ctx.beginPath();

    data.forEach(
      (item, index) => {
        const x =
          data.length === 1
            ? paddingLeft +
              chartWidth / 2
            : paddingLeft +
              (index /
                (data.length - 1)) *
                chartWidth;

        /*
         * Normalize value between 0 and 1.
         */
        const range =
          maxValue - minValue ||
          1;

        const normalized =
          (item.count -
            minValue) /
          range;

        const y =
          paddingTop +
          chartHeight -
          normalized *
            chartHeight;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      },
    );

    ctx.stroke();

    /*
     * Draw points.
     */
    ctx.fillStyle = "#1769ff";

    data.forEach(
      (item, index) => {
        const x =
          data.length === 1
            ? paddingLeft +
              chartWidth / 2
            : paddingLeft +
              (index /
                (data.length - 1)) *
                chartWidth;

        const range =
          maxValue - minValue ||
          1;

        const normalized =
          (item.count -
            minValue) /
          range;

        const y =
          paddingTop +
          chartHeight -
          normalized *
            chartHeight;

        ctx.beginPath();

        ctx.arc(
          x,
          y,
          2.5,
          0,
          Math.PI * 2,
        );

        ctx.fill();
      },
    );
  }, [data]);

  return (
    <canvas
      ref={ref}
      className="h-[185px] w-full"
    />
  );
}

/* =========================================================
   Verification Donut
========================================================= */

interface VerificationDonutProps {
  data: VerificationOverview[];
}

export function VerificationDonut({
  data,
}: VerificationDonutProps) {
  /*
   * Calculate total verification count.
   */
  const total =
    data.reduce(
      (sum, item) =>
        sum + item.count,
      0,
    );

  /*
   * Known statuses.
   */
  const verified =
    getStatusCount(
      data,
      "VERIFIED",
    );

  const inProgress =
    getStatusCount(
      data,
      "IN_PROGRESS",
    );

  const pending =
    getStatusCount(
      data,
      "PENDING",
    );

  const rejected =
    getStatusCount(
      data,
      "REJECTED",
    );

  /*
   * Build segments dynamically.
   */
  const segments = [
    {
      label: "Verified",
      value: verified,
      color: "#20b879",
    },
    {
      label: "In Progress",
      value: inProgress,
      color: "#3b82f6",
    },
    {
      label: "Pending",
      value: pending,
      color: "#f6b82e",
    },
    {
      label: "Rejected",
      value: rejected,
      color: "#ef4444",
    },
  ];

  /*
   * Generate conic-gradient.
   */
  const gradient =
    buildDonutGradient(
      segments,
      total,
    );

  return (
    <div className="flex items-center gap-7">
      {/* Donut */}
      <div
        className="relative h-[150px] w-[150px] rounded-full"
        style={{
          background:
            gradient,
        }}
      >
        <div className="absolute inset-[25px] flex flex-col items-center justify-center rounded-full bg-white">
          <b className="text-xl">
            {total.toLocaleString()}
          </b>

          <span className="text-[10px] text-slate-500">
            Total
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-3 text-xs">
        {segments.map(
          (segment) => (
            <Legend
              key={
                segment.label
              }
              color={
                segment.color
              }
              label={
                segment.label
              }
              value={
                segment.value
              }
              total={total}
            />
          ),
        )}
      </div>
    </div>
  );
}

/* =========================================================
   Helpers
========================================================= */

function getStatusCount(
  data: VerificationOverview[],
  status: string,
): number {
  const item =
    data.find(
      (entry) =>
        normalizeStatus(
          entry.status,
        ) ===
        normalizeStatus(
          status,
        ),
    );

  return item?.count || 0;
}

function normalizeStatus(
  status: string,
): string {
  return status
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

function buildDonutGradient(
  segments: {
    label: string;
    value: number;
    color: string;
  }[],
  total: number,
): string {
  /*
   * No data.
   */
  if (total === 0) {
    return "#e2e8f0 0 100%";
  }

  let currentPercentage = 0;

  const stops: string[] = [];

  for (const segment of segments) {
    if (segment.value <= 0) {
      continue;
    }

    const percentage =
      (segment.value / total) *
      100;

    const start =
      currentPercentage;

    const end =
      currentPercentage +
      percentage;

    stops.push(
      `${segment.color} ${start}% ${end}%`,
    );

    currentPercentage = end;
  }

  /*
   * Make sure the full circle
   * is covered.
   */
  if (
    currentPercentage < 100
  ) {
    stops.push(
      `#e2e8f0 ${currentPercentage}% 100%`,
    );
  }

  return `conic-gradient(${stops.join(
    ", ",
  )})`;
}

function Legend({
  color,
  label,
  value,
  total,
}: {
  color: string;
  label: string;
  value: number;
  total: number;
}) {
  const percentage =
    total > 0
      ? (value / total) * 100
      : 0;

  return (
    <div className="flex items-center gap-2">
      <span
        className="h-2 w-2 rounded-full"
        style={{
          background: color,
        }}
      />

      <span className="w-[68px]">
        {label}
      </span>

      <b>
        {value.toLocaleString()}{" "}
        ({percentage.toFixed(1)}%)
      </b>
    </div>
  );
}