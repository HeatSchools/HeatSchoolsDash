"use client";

/**
 * Panel modal de detalle de escuela.
 * Paso 5: aquí se inicializa DuckDB-WASM (una sola vez) y se consulta el Parquet
 * reciente filtrado por school_id; en paralelo se carga el JSON histórico semanal.
 */
import { useEffect, useState } from "react";
import type { CountrySlug, HistoricalSeries, SchoolProperties } from "@/lib/types";
import { queryRecentSchool } from "@/lib/duckdb";
import { TemperatureDetailChart } from "./Charts";

interface Props {
  school: SchoolProperties;
  countrySlug: CountrySlug;
  onClose: () => void;
}

export default function SchoolDetailModal({ school, countrySlug, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [daily, setDaily] = useState<{ date: string; tmax_c: number }[]>([]);
  const [weekly, setWeekly] = useState<{ week_start: string; tmax_c: number }[]>([]);
  const [chartMode, setChartMode] = useState<"daily" | "weekly" | "both">("both");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [recentRows, histRes] = await Promise.all([
          queryRecentSchool(countrySlug, school.school_id),
          fetch(`/data/historical/${countrySlug}/${school.school_id}.json`).then((r) => {
            if (!r.ok) throw new Error("Histórico no encontrado");
            return r.json() as Promise<HistoricalSeries>;
          }),
        ]);

        if (cancelled) return;

        setDaily(recentRows.map((r) => ({ date: r.date, tmax_c: r.tmax_c })));
        setWeekly(
          histRes.week_start.map((w, i) => ({
            week_start: w,
            tmax_c: histRes.tmax_c[i],
          }))
        );
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error al cargar datos");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [school.school_id, countrySlug]);

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="school-title"
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>

        <h2 id="school-title">{school.school_name}</h2>
        <p className="modal-meta">
          {school.admin2} · {school.level} · {school.sector} · {school.enrollment} estudiantes ·{" "}
          {school.urban_rural}
        </p>

        <div className="modal-kpis">
          <div className="modal-kpi">
            <div className="val">{school.heat_days_30}</div>
            <div className="lbl">Días ≥30°C</div>
          </div>
          <div className="modal-kpi">
            <div className="val">{school.heat_days_35}</div>
            <div className="lbl">Días ≥35°C</div>
          </div>
          <div className="modal-kpi">
            <div className="val">{school.tx90p}</div>
            <div className="lbl">Tx90p</div>
          </div>
          <div className="modal-kpi">
            <div className="val">{school.wsdi}</div>
            <div className="lbl">WSDI</div>
          </div>
          <div className="modal-kpi">
            <div className="val">{school.wellbeing_score}</div>
            <div className="lbl">Bienestar</div>
          </div>
          <div className="modal-kpi">
            <div className="val">{school.health_index}</div>
            <div className="lbl">Salud</div>
          </div>
        </div>

        <div className="chart-toggle">
          {(["daily", "weekly", "both"] as const).map((m) => (
            <button
              key={m}
              type="button"
              className={chartMode === m ? "active" : ""}
              onClick={() => setChartMode(m)}
            >
              {m === "daily" ? "24 meses (diario)" : m === "weekly" ? "15 años (semanal)" : "Ambos"}
            </button>
          ))}
        </div>

        {loading && <div className="loading">Cargando series con DuckDB-WASM…</div>}
        {error && <div className="loading" style={{ color: "var(--color-accent)" }}>{error}</div>}
        {!loading && !error && (
          <TemperatureDetailChart daily={daily} weekly={weekly} mode={chartMode} />
        )}
      </div>
    </div>
  );
}
