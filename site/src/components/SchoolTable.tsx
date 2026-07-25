"use client";

import type { SchoolProperties } from "@/lib/types";
import ExportToolbar from "./ExportToolbar";
import { downloadCsv } from "@/lib/export";

/**
 * Tabla de escuelas filtrada; clic abre el panel de detalle.
 */
export default function SchoolTable({
  schools,
  onSelect,
  exportName = "escuelas",
}: {
  schools: SchoolProperties[];
  onSelect: (id: string) => void;
  exportName?: string;
}) {
  const exportCsv = () => {
    downloadCsv(
      `${exportName}-tabla.csv`,
      ["school_id", "school_name", "admin1", "level", "sector", "urban_rural", "tmax_avg_c", "wellbeing_score", "health_index"],
      schools.map((s) => [
        s.school_id,
        s.school_name,
        s.admin1,
        s.level,
        s.sector,
        s.urban_rural,
        s.tmax_avg_c,
        s.wellbeing_score,
        s.health_index,
      ])
    );
  };

  return (
    <div className="table-panel-wrap">
      <ExportToolbar variant="block" onCsv={exportCsv} />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Escuela</th>
              <th>Región</th>
              <th>Nivel</th>
              <th>Tmax avg</th>
              <th>Bienestar</th>
            </tr>
          </thead>
          <tbody>
            {schools.map((s) => (
              <tr key={s.school_id} onClick={() => onSelect(s.school_id)}>
                <td>{s.school_name}</td>
                <td>{s.admin1}</td>
                <td>{s.level}</td>
                <td>{s.tmax_avg_c}°C</td>
                <td>{s.wellbeing_score}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {schools.length === 0 && (
          <p style={{ padding: "1rem", color: "var(--color-text-muted)" }}>
            No hay escuelas con los filtros seleccionados.
          </p>
        )}
      </div>
    </div>
  );
}
