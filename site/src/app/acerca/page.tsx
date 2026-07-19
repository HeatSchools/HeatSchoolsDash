/**
 * Página Sobre el proyecto HeatSchools.
 */
export default function AcercaPage() {
  return (
    <div className="container acerca-page">
      <h1>Sobre HeatSchools</h1>
      <p className="acerca-lead">
        HeatSchools es un proyecto de investigación financiado por el Wellcome Climate Impacts
        Award que estudia cómo el calor extremo afecta la salud, el bienestar y el aprendizaje
        del estudiantado en escuelas de América Latina.
      </p>
      <section className="panel">
        <h2>Este dashboard</h2>
        <p>
          Visualizador de datos para explorar exposición al calor en establecimientos
          educacionales de Chile, Colombia y Perú. La muestra actual (600 escuelas) es
          100 % ficticia y sirve para validar la interfaz antes de conectar fuentes oficiales.
        </p>
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
