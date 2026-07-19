import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import Header from "@/components/Header";
import "@/styles/globals.css";
import "maplibre-gl/dist/maplibre-gl.css";

export const metadata: Metadata = {
  title: "HeatSchools Dashboard",
  description:
    "Visualizador de exposición al calor extremo en escuelas de América Latina (Chile, Colombia, Perú).",
};

/**
 * Layout raíz del sitio estático HeatSchools.
 * Paso 2: envuelve todas las páginas con tema, cabecera y estilos globales.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning data-theme="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider>
          <Header />
          <main>{children}</main>
          <footer className="footer">
            © HeatSchools. Wellcome Climate Impacts Award. Licencia MIT.
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
