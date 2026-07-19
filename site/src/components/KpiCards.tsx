/**
 * Tarjetas KPI reutilizables (home y páginas de país).
 */
interface KpiItem {
  label: string;
  value: string | number;
}

export default function KpiCards({ items }: { items: KpiItem[] }) {
  return (
    <div className="kpi-row">
      {items.map((item) => (
        <div key={item.label} className="kpi-card">
          <div className="kpi-value">{item.value}</div>
          <div className="kpi-label">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

/** Fila compacta de KPIs para el panel home (estilo dashboard ENEL·LUZ) */
export function CompactKpiRow({ items }: { items: KpiItem[] }) {
  return (
    <div className="kpi-row-compact">
      {items.map((item) => (
        <div key={item.label} className="kpi-compact">
          <div className="kpi-compact-value">{item.value}</div>
          <div className="kpi-compact-label">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
