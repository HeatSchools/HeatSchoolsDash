import Image from "next/image";
import TeamSocialLinks from "@/components/TeamSocialLinks";
import teamData from "@/data/team.json";

const REPO_URL = "https://github.com/JDConejeros/HeatSchoolsDash";

type TeamMember = {
  id: string;
  name: string;
  degree: string | null;
  role: string;
  affiliation: string | string[];
  photo: string;
  linkedin: string | null;
  orcid: string | null;
  github: string | null;
};

function formatMemberName(member: TeamMember): string {
  return member.degree ? `${member.degree} ${member.name}` : member.name;
}

function formatAffiliations(affiliation: string | string[]): string[] {
  return Array.isArray(affiliation) ? affiliation : [affiliation];
}

/**
 * Página Sobre el proyecto HeatSchools.
 */
export default function AcercaPage() {
  const team = teamData.members as TeamMember[];

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
        <h2>Equipo</h2>
        <div className="team-grid">
          {team.map((member) => (
            <article key={member.id} className="team-card">
              <div className="team-photo-wrap">
                <Image
                  src={member.photo}
                  alt={`Fotografía de ${formatMemberName(member)}`}
                  width={330}
                  height={330}
                  className="team-photo"
                />
              </div>
              <h3 className="team-name">{formatMemberName(member)}</h3>
              <p className="team-role">{member.role}</p>
              <p className="team-affiliation">
                {formatAffiliations(member.affiliation).map((line) => (
                  <span key={line} className="team-affiliation-line">
                    {line}
                  </span>
                ))}
              </p>
              <TeamSocialLinks
                linkedin={member.linkedin}
                orcid={member.orcid}
                github={member.github}
              />
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>El visualizador</h2>
        <p>
          HeatSchools Dashboard es un visualizador web interactivo para explorar cómo el calor
          afecta a establecimientos educacionales en Chile, Colombia y Perú. Combina mapas,
          indicadores agregados y series de temperatura para apoyar el análisis y la
          comunicación con equipos técnicos, comunidades escolares y tomadores de decisión.
        </p>
        <p className="acerca-objectives-label">Objetivos del visualizador:</p>
        <ul className="acerca-list">
          <li>Hacer legible la magnitud y distribución geográfica del calor en escuelas.</li>
          <li>Comparar indicadores climáticos, de bienestar y de salud entre países y territorios.</li>
          <li>Facilitar la exploración desde el panorama regional hasta el detalle por escuela.</li>
          <li>Entregar gráficos y mapas exportables para informes, talleres e incidencia pública.</li>
          <li>Servir como plataforma abierta y reproducible para futuras rondas de datos reales.</li>
        </ul>
      </section>

      <section className="panel">
        <h2>Metodología</h2>
        <p>
          El visualizador integra datos geoespaciales, series climáticas y métricas de bienestar
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
        <div className="acerca-repo-wrap">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="acerca-repo-btn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Revisa nuestro repositorio
          </a>
        </div>
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
