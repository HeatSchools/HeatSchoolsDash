"use client";

import type { SchoolProperties } from "@/lib/types";

/**
 * Tabla de escuelas filtrada; clic abre el panel de detalle.
 */
export default function SchoolTable({
  schools,
  onSelect,
}: {
  schools: SchoolProperties[];
  onSelect: (id: string) => void;
}) {
  return (
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
  );
}
