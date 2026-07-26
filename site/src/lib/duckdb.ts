/**
 * Cliente DuckDB-WASM para consultar Parquet reciente bajo demanda.
 * Paso 5: solo se inicializa al abrir el detalle de una escuela (modal).
 * Usa HTTP Range Requests vía httpfs — no descarga el Parquet completo.
 */
import type { RecentRow } from "./types";

let dbPromise: Promise<import("@duckdb/duckdb-wasm").AsyncDuckDB> | null = null;

async function getDb() {
  if (typeof window === "undefined") {
    throw new Error("DuckDB-WASM solo está disponible en el navegador");
  }
  if (!dbPromise) {
    dbPromise = (async () => {
      const duckdb = await import("@duckdb/duckdb-wasm/dist/duckdb-browser.mjs");
      const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
      const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
      const worker_url = URL.createObjectURL(
        new Blob([`importScripts("${bundle.mainWorker!}");`], { type: "text/javascript" })
      );
      const worker = new Worker(worker_url);
      const logger = new duckdb.ConsoleLogger();
      const db = new duckdb.AsyncDuckDB(logger, worker);
      await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
      URL.revokeObjectURL(worker_url);
      return db;
    })();
  }
  return dbPromise;
}

export async function queryRecentSchool(
  countrySlug: string,
  schoolId: string
): Promise<RecentRow[]> {
  const db = await getDb();
  const conn = await db.connect();

  // Registrar el Parquet remoto/local vía httpfs (Range Requests en producción)
  const parquetUrl = `${window.location.origin}/data/recent/${countrySlug}.parquet`;
  await conn.query(`
    INSTALL httpfs;
    LOAD httpfs;
  `);

  const result = await conn.query(`
    SELECT school_id, country, date::VARCHAR AS date,
           tmax_c, tmin_c, pet_c, wbgt_c
    FROM read_parquet('${parquetUrl}')
    WHERE school_id = '${schoolId}'
    ORDER BY date
  `);

  await conn.close();

  return result.toArray().map((row) => ({
    school_id: String(row.school_id),
    country: String(row.country),
    date: String(row.date).slice(0, 10),
    tmax_c: Number(row.tmax_c),
    tmin_c: Number(row.tmin_c),
    pet_c: Number(row.pet_c),
    wbgt_c: Number(row.wbgt_c),
  }));
}

export function isDuckDbReady() {
  return dbPromise !== null;
}
