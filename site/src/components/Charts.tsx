"use client";

/**
 * Gráficos Observable Plot: barras por región y línea de evolución Tmax.
 */
import { useEffect, useRef } from "react";
import * as Plot from "@observablehq/plot";

interface BarData {
  region: string;
  count: number;
}

interface LineData {
  month: string;
  tmax: number;
}

export function RegionBarChart({ data }: { data: BarData[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || data.length === 0) return;
    ref.current.innerHTML = "";
    const chart = Plot.plot({
      marginLeft: 100,
      height: 280,
      x: { label: "Escuelas", grid: true },
      y: { label: null },
      marks: [
        Plot.barX(data, {
          y: "region",
          x: "count",
          fill: "var(--color-accent-warm)",
          sort: { y: "-x" },
        }),
        Plot.text(data, {
          y: "region",
          x: "count",
          text: (d) => String(d.count),
          dx: 8,
          fill: "var(--color-text-muted)",
        }),
      ],
    });
    ref.current.append(chart);
    return () => chart.remove();
  }, [data]);

  return <div ref={ref} className="plot-chart" />;
}

export function TmaxLineChart({ data }: { data: LineData[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || data.length === 0) return;
    ref.current.innerHTML = "";
    const chart = Plot.plot({
      height: 280,
      marginBottom: 40,
      x: { label: null, tickRotate: -45 },
      y: { label: "Tmax promedio (°C)", grid: true },
      marks: [
        Plot.lineY(data, { x: "month", y: "tmax", stroke: "var(--color-accent)", strokeWidth: 2 }),
        Plot.dot(data, { x: "month", y: "tmax", fill: "var(--color-accent)", r: 3 }),
      ],
    });
    ref.current.append(chart);
    return () => chart.remove();
  }, [data]);

  return <div ref={ref} className="plot-chart" />;
}

export function TemperatureDetailChart({
  daily,
  weekly,
  mode,
}: {
  daily: { date: string; tmax_c: number }[];
  weekly: { week_start: string; tmax_c: number }[];
  mode: "daily" | "weekly" | "both";
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";

    const marks: Plot.Markish[] = [];

    if (mode === "daily" || mode === "both") {
      marks.push(
        Plot.lineY(daily, {
          x: (d) => new Date(d.date),
          y: "tmax_c",
          stroke: "var(--color-accent)",
          strokeWidth: 1.5,
        })
      );
    }
    if (mode === "weekly" || mode === "both") {
      marks.push(
        Plot.lineY(weekly, {
          x: (d) => new Date(d.week_start),
          y: "tmax_c",
          stroke: "var(--color-primary)",
          strokeWidth: mode === "both" ? 1 : 2,
          strokeOpacity: mode === "both" ? 0.6 : 1,
        })
      );
    }

    const chart = Plot.plot({
      height: 260,
      marginBottom: 40,
      x: { label: null, type: "utc" },
      y: { label: "Tmax (°C)", grid: true },
      marks,
    });
    ref.current.append(chart);
    return () => chart.remove();
  }, [daily, weekly, mode]);

  return <div ref={ref} className="plot-chart" />;
}
