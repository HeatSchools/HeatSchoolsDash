"use client";

/**
 * Gráficos del panel home: tortas con % en blanco y series diarias por país.
 */
import { useEffect, useRef, useState } from "react";
import * as Plot from "@observablehq/plot";
import type { PieSlice } from "@/lib/distributions";
import type { DailyClimateSeries } from "@/lib/climate";
import { formatDayLabel } from "@/lib/climate";
import { useTheme } from "./ThemeProvider";
import ExportToolbar from "./ExportToolbar";
import { downloadCsv, downloadSvgAsPng, shareLink } from "@/lib/export";
import {
  applyLineDrawProgress,
  useViewportChartAnimation,
} from "@/hooks/useViewportChartAnimation";

const PIE_COLORS = ["#e07a5f", "#f2a154", "#1e4d6b", "#6db3d9", "#c05621", "#94a3b8"];
const WINDOW_DAYS = 30;
const Y_DOMAIN: [number, number] = [17.5, 27.5];

export function PieChart({ data }: { data: PieSlice[] }) {
  const { containerRef, progress } = useViewportChartAnimation(950);
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let acc = 0;
  const stops: string[] = [];
  const labels: { pct: number; midAngle: number; key: string }[] = [];

  data.forEach((d, i) => {
    const finalStart = (acc / total) * 100;
    acc += d.value;
    const finalEnd = (acc / total) * 100;
    const start = finalStart * progress;
    const end = finalEnd * progress;
    stops.push(`${PIE_COLORS[i % PIE_COLORS.length]} ${start}% ${end}%`);
    const midAngle = ((finalStart + finalEnd) / 200) * 360 - 90;
    labels.push({
      pct: Math.round((d.value / total) * 100),
      midAngle,
      key: d.label,
    });
  });

  const labelOpacity = progress >= 0.92 ? 1 : Math.max(0, (progress - 0.75) / 0.17);

  return (
    <div ref={containerRef} className="pie-wrap">
      <div className="pie-ring">
        <div
          className="pie-donut"
          style={{
            background:
              progress > 0
                ? `conic-gradient(from -90deg, ${stops.join(", ")})`
                : "conic-gradient(transparent 0%, transparent 100%)",
          }}
          role="img"
          aria-label="Gráfico de distribución"
        />
        {labels.map((l) => {
          if (l.pct < 5) return null;
          const rad = (l.midAngle * Math.PI) / 180;
          const x = Math.cos(rad) * 45;
          const y = Math.sin(rad) * 45;
          return (
            <span
              key={l.key}
              className="pie-slice-pct"
              style={{
                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                opacity: labelOpacity,
              }}
            >
              {l.pct}%
            </span>
          );
        })}
      </div>
      <div className="pie-labels" style={{ opacity: 0.35 + labelOpacity * 0.65 }}>
        {data.map((d, i) => (
          <span key={d.label}>
            <i style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function DailyTmaxChart({
  series,
  label,
  animated = true,
}: {
  series: DailyClimateSeries;
  label: string;
  animated?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { containerRef, progress } = useViewportChartAnimation(1100);
  const { theme } = useTheme();
  const [windowEnd, setWindowEnd] = useState(() => Math.min(WINDOW_DAYS, series.date.length));

  useEffect(() => {
    setWindowEnd(Math.min(WINDOW_DAYS, series.date.length));
  }, [series.date.length]);

  useEffect(() => {
    if (!animated || series.date.length <= WINDOW_DAYS) return;
    const timer = window.setInterval(() => {
      setWindowEnd((prev) => (prev >= series.date.length ? WINDOW_DAYS : prev + 1));
    }, 400);
    return () => window.clearInterval(timer);
  }, [animated, series.date.length]);

  useEffect(() => {
    if (!ref.current || !series.date.length) return;
    ref.current.innerHTML = "";

    const end = Math.min(windowEnd, series.date.length);
    const start = Math.max(0, end - WINDOW_DAYS);
    const sliceDates = series.date.slice(start, end);
    const sliceTmax = series.tmax_c.slice(start, end);

    const rows = sliceDates.map((d, i) => ({
      date: formatDayLabel(d),
      tmax: sliceTmax[i],
    }));

    const stroke = theme === "dark" ? "#f2a154" : "#e07a5f";
    const gridColor = theme === "dark" ? "#2d3f54" : "#e8e4df";
    const tickColor = theme === "dark" ? "#94a3b8" : "#5c6370";
    const pointWidth = 22;

    const chart = Plot.plot({
      width: Math.max(320, sliceDates.length * pointWidth),
      height: 165,
      marginBottom: 50,
      marginLeft: 40,
      marginRight: 8,
      x: {
        label: null,
        tickRotate: -55,
        tickSize: 4,
        tickFormat: (_: string, i: number) => rows[i]?.date ?? "",
      },
      y: {
        label: null,
        grid: true,
        tickFormat: (v: number) => `${v}°`,
        domain: Y_DOMAIN,
      },
      marks: [
        Plot.gridY({ stroke: gridColor, strokeOpacity: 0.8, ticks: 7 }),
        Plot.lineY(rows, {
          x: (_d, i) => i,
          y: "tmax",
          stroke,
          strokeWidth: 1.75,
        }),
        Plot.dot(rows, {
          x: (_d, i) => i,
          y: "tmax",
          fill: stroke,
          r: 2,
        }),
      ],
    });

    chart.querySelectorAll("text").forEach((node) => {
      const el = node as SVGTextElement;
      el.setAttribute("fill", tickColor);
      el.setAttribute("font-size", "11");
    });

    ref.current.append(chart);

    applyLineDrawProgress(chart.querySelector("svg"), progress);

    if (scrollRef.current && animated) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }

    return () => chart.remove();
  }, [series, windowEnd, theme, animated, progress]);

  useEffect(() => {
    const svg = ref.current?.querySelector("svg") as SVGSVGElement | null;
    applyLineDrawProgress(svg, progress);
  }, [progress]);

  const exportCsv = () => {
    downloadCsv(
      `tmax-diaria-${label.toLowerCase().replace(/\s+/g, "-")}.csv`,
      ["fecha", "tmax_c"],
      series.date.map((d, i) => [d, series.tmax_c[i]])
    );
  };

  const exportPng = async () => {
    const svg = ref.current?.querySelector("svg");
    if (!svg) return;
    await downloadSvgAsPng(svg, `tmax-diaria-${label.toLowerCase().replace(/\s+/g, "-")}.png`);
  };

  const exportShare = () => {
    void shareLink(`Tmax diaria · ${label}`, `Serie de temperatura máxima diaria para ${label}.`);
  };

  return (
    <div ref={containerRef} className="daily-chart-wrap">
      <ExportToolbar
        variant="block"
        onShare={exportShare}
        onPng={() => void exportPng()}
        onCsv={exportCsv}
      />
      <div ref={scrollRef} className="daily-chart-scroll">
        <div ref={ref} className="plot-chart daily-chart" />
      </div>
    </div>
  );
}
