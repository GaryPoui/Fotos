import pg from "pg";
import { readFileSync } from "node:fs";
import { openDb } from "./db.js";

type Value = string | number | null;
export interface Database {
  prepare(sql: string): {
    get(...values: Value[]): unknown | Promise<unknown>;
    all(...values: Value[]): unknown[] | Promise<unknown[]>;
    run(...values: Value[]): unknown | Promise<unknown>;
  };
  close(): void | Promise<void>;
}

// Only the application's fixed SQL goes through this adapter, never user SQL.
export function postgresSql(sql: string) {
  let parameter = 0;
  return sql
    .replace(/\?/g, () => "$" + ++parameter)
    .replace(/\b(createdAt|storedBytes|capturedAt|captureOffset|dateSource)\b/g, '"$1"')
    .replace(/\b(meta|sessions|media|notes)\b/g, "rincon.$1");
}

export function queryDatabase(
  query: (sql: string, values: Value[]) => Promise<{ rows: unknown[] }>,
  close: () => void | Promise<void>,
): Database {
  return {
    prepare(sql) {
      const run = (...values: Value[]) => query(postgresSql(sql), values);
      return {
        get: async (...values) => (await run(...values)).rows[0],
        all: async (...values) => (await run(...values)).rows,
        run,
      };
    },
    close,
  };
}

export async function openDatabase(
  dir: string,
  url?: string,
  ca?: string,
): Promise<Database> {
  if (!url) return openDb(dir);
  const connection = new URL(url);
  // URI ssl options override pg's SSL object. Never allow them to disable verification.
  for (const name of ["sslmode", "sslcert", "sslkey", "sslrootcert"])
    connection.searchParams.delete(name);
  const pool = new pg.Pool({
    connectionString: connection.toString(),
    max: 3,
    connectionTimeoutMillis: 15_000,
    idleTimeoutMillis: 30_000,
    ssl: {
      rejectUnauthorized: true,
      ...(ca
        ? {
            ca: ca.includes("BEGIN CERTIFICATE")
              ? ca
              : readFileSync(ca, "utf8"),
          }
        : {}),
    },
  });
  pool.on("error", () =>
    console.error("Conexión de base remota interrumpida."),
  );
  try {
    // Schema is installed explicitly before deployment, with a separate admin credential.
    await pool.query("SELECT key FROM rincon.meta LIMIT 1");
  } catch {
    await pool.end();
    throw new Error(
      "No se pudo abrir la base remota. Revisá conexión TLS y esquema rincon.",
    );
  }
  return queryDatabase(
    (sql, values) => pool.query(sql, values),
    () => pool.end(),
  );
}
