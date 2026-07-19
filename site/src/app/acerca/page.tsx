import Image from "next/image";

/**
 * Página Sobre el proyecto HeatSchools.
 * Borrador de equipo: misma ficha repetida hasta integrar datos definitivos.
 */

const TEAM_PHOTO = "/images/team/rayana-santos-araujo-palharini.jpg";

const DRAFT_MEMBER = {
  name: "Rayana Santos Araujo Palharini",
  role: "Meteoróloga",
  affiliation:
    "Departamento de Prevención de Riesgos y Medio Ambiente, Facultad de Ciencias de la Construcción y Ordenamiento Territorial, UTEM",
};

const TEAM_PLACEHOLDERS = Array.from({ length: 6 }, (_, i) => ({
  id: `draft-${i + 1}`,
  ...DRAFT_MEMBER,
}));

export default function AcercaPage() {
  return (
    <div className="container acerca-page">
      <h1>Sobre el proyecto</h1>
      <p className="acerca-lead">
        HeatSchools es una iniciativa de investigación apoyada por el Wellcome Climate Impacts
        Award que busca hacer visible la exposición al calor extremo en escuelas de América
        Latina y catalizar acciones para proteger la salud, el bienestar y el aprendizaje del
        estudiantado en un clima cambiante.
      </p>

      <section className="panel">
        <h2>El dashboard</h2>
        <p>
          HeatSchools Dashboard es un visualizador web interactivo para explorar cómo el calor
          afecta a establecimientos educacionales en Chile, Colombia y Perú. Combina mapas,
          indicadores agregados y series de temperatura para apoyar el análisis y la
          comunicación con equipos técnicos, comunidades escolares y tomadores de decisión.
        </p>
        <p className="acerca-note">
          La muestra actual (600 escuelas) es ficticia y sirve para validar la interfaz antes
          de conectar fuentes oficiales.
        </p>
      </section>

      <section className="panel">
        <h2>Objetivos del dashboard</h2>
        <ul className="acerca-list">
          <li>Hacer legible la magnitud y distribución geográfica del calor en escuelas.</li>
          <li>Comparar indicadores climáticos, de bienestar y de salud entre países y territorios.</li>
          <li>Facilitar la exploración desde el panorama regional hasta el detalle por escuela.</li>
          <li>Entregar gráficos y mapas exportables para informes, talleres e incidencia pública.</li>
          <li>Servir como plataforma abierta y reproducible para futuras rondas de datos reales.</li>
        </ul>
      </section>

      <section className="panel">
        <h2>Equipo</h2>
        <p className="acerca-section-intro">
          Borrador de presentación del equipo (3 columnas × 2 filas). Los perfiles definitivos
          se actualizarán en una próxima versión.
        </p>
        <div className="team-grid">
          {TEAM_PLACEHOLDERS.map((member) => (
            <article key={member.id} className="team-card">
              <div className="team-photo-wrap">
                <Image
                  src={TEAM_PHOTO}
                  alt={`Fotografía de ${member.name}`}
                  width={303}
                  height={304}
                  className="team-photo"
                />
              </div>
              <h3 className="team-name">{member.name}</h3>
              <p className="team-role">{member.role}</p>
              <p className="team-affiliation">{member.affiliation}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Metodología</h2>
        <p>
          El dashboard integra datos geoespaciales, series climáticas y métricas de bienestar
          en un flujo reproducible orientado a la exploración y la exportación de evidencia.
        </p>
        <ul className="acerca-list acerca-methods">
          <li>
            <strong>Datos geoespaciales:</strong> escuelas en GeoJSON con coordenadas, atributos
            administrativos y variables de exposición al calor; mapas con MapLibre GL JS y
            agrupación (clustering) de puntos.
          </li>
          <li>
            <strong>Agregaciones:</strong> indicadores globales y por país (conteos, promedios de
            Tmax, bienestar, salud y días calurosos) calculados en el build del sitio estático.
          </li>
          <li>
            <strong>Series temporales:</strong> Tmax diaria simulada por país, visualizada con
            Observable Plot y ventanas deslizantes para lectura dinámica.
          </li>
          <li>
            <strong>Detalle escolar:</strong> consulta bajo demanda con DuckDB-WASM sobre
            archivos Parquet en el navegador, sin servidor de aplicación.
          </li>
          <li>
            <strong>Pipeline de datos:</strong> generación y validación de datos ficticios en
            Python (<code>pipeline/simulate_data.py</code>), con esquema compartido y pruebas
            automatizadas.
          </li>
          <li>
            <strong>Publicación:</strong> export estático con Next.js para despliegue en GitHub
            Pages o CDN, con temas claro/oscuro y exportación Compartir / PNG / CSV.
          </li>
        </ul>
      </section>

      <section className="panel">
        <h2>Países del estudio</h2>
        <ul className="acerca-list">
          <li><strong>Chile:</strong> UChile, MICROBR y Corporación Ciudades</li>
          <li><strong>Colombia:</strong> Universidad de los Andes</li>
          <li><strong>Perú:</strong> UPCH (institución anfitriona)</li>
        </ul>
      </section>
    </div>
  );
}
