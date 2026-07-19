import type { NextConfig } from "next";

/**
 * Paso 2 del proyecto: export estático para GitHub Pages / CDN.
 * No hay servidor de aplicación en producción; todo se sirve como archivos estáticos.
 */
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  // DuckDB-WASM y MapLibre requieren transpilar paquetes ESM
  transpilePackages: ["@duckdb/duckdb-wasm"],
};

export default nextConfig;
