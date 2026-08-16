import HomePageClient from "@/components/HomePageClient";

export default function HomePage() {
  return (
    <div className="container">
      <section className="hero">
        <h1 className="hero-tagline">Hacer visible a un asesino silencioso</h1>
        <p className="hero-subtitle">
          Catalizar la acción política para proteger la salud y el bienestar del estudiantado
          frente al calor extremo en un clima cambiante en América Latina.
        </p>
      </section>

      <HomePageClient />

      <div className="disclaimer">
        <strong>Aviso:</strong> todos los datos mostrados en este dashboard son 100% ficticios
        y sirven únicamente para probar la interfaz. No deben usarse para análisis ni
        decisiones de política pública.
      </div>
    </div>
  );
}
