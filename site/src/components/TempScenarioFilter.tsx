"use client";

import type { TempScenarioId } from "@/lib/tempGrid";
import {
  TEMP_COLOR_STOPS,
  TEMP_SCENARIOS,
  tempLegendGradient,
} from "@/lib/tempGrid";

interface Props {
  value: TempScenarioId;
  onChange: (id: TempScenarioId) => void;
}

/**
 * Selector de escenario climático y leyenda de Tmax para la grilla.
 */
export default function TempScenarioFilter({ value, onChange }: Props) {
  return (
    <div className="temp-map-header">
      <div className="temp-scenario-filter" role="group" aria-label="Escenario de temperatura">
        <span className="temp-scenario-label">Tmax grilla 25 km</span>
        <div className="temp-scenario-options">
          {TEMP_SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`temp-scenario-btn ${value === s.id ? "active" : ""}`}
              onClick={() => onChange(s.id)}
              aria-pressed={value === s.id}
              title={s.hint}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="temp-grid-legend" aria-label="Leyenda de temperatura máxima">
        <span className="temp-legend-label">Tmax (°C)</span>
        <div className="temp-legend-bar-wrap">
          <div
            className="temp-legend-bar"
            style={{ background: tempLegendGradient() }}
            role="img"
            aria-hidden="true"
          />
          <div className="temp-legend-ticks">
            {TEMP_COLOR_STOPS.map((stop) => (
              <span key={stop.value} className="temp-legend-tick">
                {stop.value}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
