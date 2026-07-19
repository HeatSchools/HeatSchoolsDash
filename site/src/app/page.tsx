import Link from "next/link";
import { loadAllSchools, countByCountry } from "@/lib/schools";
import { computeGlobalKpis } from "@/lib/aggregates";
import { COUNTRIES } from "@/lib/types";
import KpiCards from "@/components/KpiCards";

/**
 * Página de inicio (Home).
 * Paso 3: hero, tarjetas por país y KPIs globales desde GeoJSON.
 * No inicializa DuckDB-WASM — solo datos resumen pre-agregados en memoria.
 */
export default function HomePage() {
  const allSchools = loadAllSchools();
  const kpis = computeGlobalKpis(allSchools);
  const counts = countByCountry();

  return (
    <div className="container">
      <section className="hero">
        <h1 className="hero-tagline">Hacer visible a un asesino silencioso</h1>
        <p className="hero-subtitle">
          Catalizar la acción política para proteger la salud y el bienestar del estudiantado
          frente al calor extremo en un clima cambiante en América Latina.
        </p>
      </section>

      <section className="country-cards">
        {COUNTRIES.map((c) => (
          <article key={c.code} className="country-card">
            <h3>{c.label}</h3>
            <div className="count">{counts[c.code]}</div>
            <div className="count-label">escuelas en la muestra</div>
            <Link href={`/${c.route}`} className="btn btn-primary">
              Explorar →
            </Link>
          </article>
        ))}
      </section>

      <KpiCards
        items={[
          { label: "Total escuelas", value: kpis.totalSchools },
          { label: "Tmax promedio", value: `${kpis.avgTmax}°C` },
          { label: "Bienestar promedio", value: kpis.avgWellbeing },
          { label: "Salud promedio", value: kpis.avgHealth },
        ]}
      />

      <div className="disclaimer">
        <strong>Aviso:</strong> todos los datos mostrados en este dashboard son 100% ficticios
        y sirven únicamente para probar la interfaz. No deben usarse para análisis ni
        decisiones de política pública.
      </div>
    </div>
  );
}
