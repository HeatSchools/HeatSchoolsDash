"""
Esquema de datos HeatSchools — fuente única de verdad para pipeline y frontend.

Paso 1 del proyecto: definir las variables que describe cada escuela y cada serie
climática. Cuando el pipeline real (01_ingest … 06_export) esté conectado, este
módulo validará los datos antes de exportarlos al sitio estático.
"""

from typing import Literal

# --- Identificadores de país ---
CountryCode = Literal["CL", "CO", "PE"]
CountrySlug = Literal["cl", "co", "pe"]

COUNTRY_SLUGS: dict[CountryCode, CountrySlug] = {
    "CL": "cl",
    "CO": "co",
    "PE": "pe",
}

COUNTRY_LABELS: dict[CountryCode, str] = {
    "CL": "Chile",
    "CO": "Colombia",
    "PE": "Perú",
}

COUNTRY_ROUTES: dict[CountryCode, str] = {
    "CL": "chile",
    "CO": "colombia",
    "PE": "peru",
}

# --- Propiedades de escuela (GeoJSON features) ---
SCHOOL_PROPERTIES = [
    "school_id",
    "school_name",
    "country",
    "admin1",
    "admin2",
    "level",
    "sector",
    "enrollment",
    "urban_rural",
    "altitude_m",
    "tmax_avg_c",
    "pet_avg_c",
    "wbgt_avg_c",
    "heat_days_30",
    "heat_days_35",
    "tx90p",
    "wsdi",
    "wellbeing_score",
    "health_index",
]

LEVELS = ["Inicial", "Primaria", "Secundaria"]
SECTORS = ["Publico", "Privado", "Subvencionado"]
URBAN_RURAL = ["Urbano", "Rural"]

# --- Parquet reciente (detalle diario, DuckDB-WASM) ---
RECENT_COLUMNS = [
    "school_id",
    "country",
    "date",
    "tmax_c",
    "tmin_c",
    "pet_c",
    "wbgt_c",
]

# --- JSON histórico (serie semanal por escuela) ---
HISTORICAL_KEYS = ["school_id", "resolution", "years", "week_start", "tmax_c", "pet_c", "wbgt_c"]

# --- Rangos plausibles de coordenadas por país (validación pytest) ---
COORD_BOUNDS: dict[CountryCode, dict[str, tuple[float, float]]] = {
    "CL": {"lat": (-56.0, -17.0), "lon": (-76.0, -66.0)},
    "CO": {"lat": (-4.5, 13.5), "lon": (-82.0, -66.0)},
    "PE": {"lat": (-19.0, 0.5), "lon": (-84.0, -68.0)},
}

N_SCHOOLS_PER_COUNTRY = 1000
