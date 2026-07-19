# HeatSchools Dashboard

Visualizador de datos del proyecto **HeatSchools** (Wellcome Climate Impacts Award): exposición al calor extremo en escuelas de Chile, Colombia y Perú.

> **Datos de demostración:** la muestra actual (600 escuelas ficticias) existe solo para desarrollar y validar el dashboard. No usar para análisis real.

## Infraestructura

| Capa | Descripción |
|------|-------------|
| **Pipeline** (`pipeline/`) | Python + DuckDB para procesamiento de datos climáticos y exportación a GeoJSON, Parquet e históricos JSON |
| **Datos** (`site/public/data/`) | Artefactos estáticos servidos al navegador (mockup versionado en git; en producción irán a un bucket de objetos) |
| **Sitio** (`site/`) | Dashboard estático (Next.js export) desplegable en GitHub Pages, Netlify o Vercel |
| **CI/CD** (`.github/workflows/`) | GitHub Actions para actualización automática del pipeline (placeholder hasta conectar fuentes reales) |

## Tecnología

- **Frontend:** Next.js 15 (static export), React 19, TypeScript
- **Mapas:** MapLibre GL JS (WebGL, clustering)
- **Gráficos y tablas:** Observable Plot
- **Consultas en navegador:** DuckDB-WASM + httpfs (Parquet vía HTTP Range Requests)
- **Pipeline (mockup):** Python 3.10+, pandas, pyarrow
- **Despliegue objetivo:** sitio 100 % estático en CDN + datos en almacenamiento de objetos

## Estructura del repositorio

```
HeatSchoolsDash/
├── pipeline/              # Scripts Python (generación y futuro procesamiento)
│   ├── simulate_data.py   # Datos artificiales de demostración
│   ├── schema.py          # Esquema compartido pipeline ↔ frontend
│   ├── requirements.txt
│   └── tests/
├── site/                  # Aplicación Next.js
│   ├── public/data/       # GeoJSON, Parquet, JSON históricos
│   └── src/
├── scripts/               # Atajos para desarrollo local
└── .github/workflows/
```

## Requisitos

- **Node.js 18+** — dashboard
- **Python 3.10+** — regenerar datos simulados (opcional)

## Cómo correr el dashboard

### Desarrollo (recomendado)

```bash
./scripts/run-dev.sh
```

Abre [http://localhost:3000](http://localhost:3000).

### Vista de producción local

```bash
./scripts/run-preview.sh
```

Compila el export estático (`site/out/`) y lo sirve en el puerto 3000.

### Manual

```bash
cd site
npm install
npm run dev          # desarrollo
npm run build        # genera site/out/
npx serve out -p 3000  # preview estático
```

### Regenerar datos simulados (opcional)

```bash
cd pipeline
pip install -r requirements.txt
python simulate_data.py
pytest tests/
```

## Producción (futuro)

1. GitHub Actions ejecuta el pipeline y publica datos a Cloudflare R2 (u otro bucket).
2. El sitio estático apunta a URLs del bucket para Parquet y GeoJSON.
3. GitHub Pages (o similar) sirve la carpeta `out/` generada por `next build`.

## Licencia

MIT — ver [LICENSE](LICENSE).
