"use client";

/**
 * Gráficos de país: barras por región y serie Tmax animada (Observable Plot).
 */
import { useCallback, useEffect, useRef } from "react";
import * as Plot from "@observablehq/plot";
import type { DailyClimateSeries } from "@/lib/climate";
import ExportToolbar from "./ExportToolbar";
import { downloadCsv, downloadSvgAsPng, shareLink } from "@/lib/export";
import { useViewportChartAnimation } from "@/hooks/useViewportChartAnimation";
import { DailyTmaxChart } from "./HomeCharts";

interface BarData {
  region: string;
  count: number;
}

export function RegionBarChart({
  data,
  exportName = "regiones",
}: {
  data: BarData[];
  exportName?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { containerRef, progress } = useViewportChartAnimation(900);

  useEffect(() => {
    if (!ref.current || data.length === 0) return;
    ref.current.innerHTML = "";

    const animated = data.map((d) => ({
      ...d,
      count: Math.max(0.5, d.count * progress),
      countLabel: d.count,
    }));

    const chart = Plot.plot({
      marginLeft: 100,
      height: 280,
      x: { label: "Escuelas", grid: true, domain: [0, Math.max(...data.map((d) => d.count)) * 1.12] },
      y: { label: null },
      marks: [
        Plot.barX(animated, {
          y: "region",
          x: "count",
          fill: "var(--color-accent-warm)",
          sort: { y: "-x" },
        }),
        Plot.text(animated, {
          y: "region",
          x: "count",
          text: (d) => String(d.countLabel),
          dx: 8,
          fill: "var(--color-text-muted)",
          opacity: progress >= 0.85 ? 1 : 0,
        }),
      ],
    });
    ref.current.append(chart);
    return () => chart.remove();
  }, [data, progress]);

  const exportCsv = useCallback(() => {
    downloadCsv(
      `${exportName}-por-region.csv`,
      ["region", "escuelas"],
      data.map((d) => [d.region, d.count])
    );
  }, [data, exportName]);

  const exportPng = useCallback(async () => {
    const svg = ref.current?.querySelector("svg");
    if (!svg) return;
    await downloadSvgAsPng(svg, `${exportName}-por-region.png`);
  }, [exportName]);

  const exportShare = useCallback(() => {
    void shareLink(`Escuelas por región · ${exportName}`, "Distribución de escuelas por región administrativa.");
  }, [exportName]);

  return (
    <div ref={containerRef} className="chart-panel-wrap">
      <ExportToolbar variant="block" onShare={exportShare} onPng={() => void exportPng()} onCsv={exportCsv} />
      <div ref={ref} className="plot-chart" />
    </div>
  );
}

export function CountryTmaxChart({
  series,
  label,
  exportName = "tmax",
}: {
  series: DailyClimateSeries;
  label: string;
  exportName?: string;
}) {
  return (
    <DailyTmaxChart
      series={series}
      label={label}
      exportName={exportName}
      animated
      showThresholdLines
      height={360}
      className="daily-chart-wrap--country"
    />
  );
}

/** @deprecated Usar CountryTmaxChart */
export function TmaxLineChart(_props: { data: { month: string; tmax: number }[] }) {
  return null;
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
