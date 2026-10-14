import pg from "pg";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, relative, join, isAbsolute, basename } from "node:path";
import { randomUUID, createHash } from "node:crypto";
import { readPhotoClock } from "../server/photo-clock.js";
import { inspectFile } from "../server/files.js";
import {
  applyPhotoClocks,
  downloadOriginal,
  type ClockCandidate,
} from "../server/backfill-photo-clocks.js";
const args = new Map<string, string>();
for (let i = 2; i < process.argv.length; i += 2)
  args.set(process.argv[i], process.argv[i + 1] || "");
const mode = args.get("--mode");
if (mode !== "scan" && mode !== "apply")
  throw new Error("Usá --mode scan o --mode apply.");
const directory = resolve(
  args.get("--snapshot") || "backups/pre-old-photo-clock-2026-10-14",
);
const privateRoot = resolve("backups");
const location = relative(privateRoot, directory);
if (location.startsWith("..") || isAbsolute(location))
  throw new Error("El snapshot debe estar dentro de backups privados.");
process.loadEnvFile(args.get("--env") || ".env.render");
const origin = "https://ailu-y-tomy.onrender.com";
const snapshot = JSON.parse(
  readFileSync(join(directory, "database.json"), "utf8"),
) as {
  tables: {
    media: Record<string, unknown>[];
    meta: { key: string; value: string }[];
  };
};
type Proposed = ClockCandidate & { original: string; sha256: string };
if (mode === "scan") {
  const login = await fetch(origin + "/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "NuestroRincon",
      Origin: origin,
    },
    body: JSON.stringify({ password: process.env.APP_PASSWORD }),
    signal: AbortSignal.timeout(120000),
  });
  if (login.status !== 200)
    throw new Error("No se pudo iniciar la sesión privada.");
  const cookie = login.headers.get("set-cookie")!.split(";")[0];
  const existing = new Set(snapshot.tables.meta.map((row) => row.key));
  const photos = snapshot.tables.media.filter(
    (row) => row.kind === "photo" && !existing.has("photo-clock:" + row.id),
  );
  const candidates: Proposed[] = [],
    missing: string[] = [],
    failures: { id: string; error: string }[] = [];
  const folder = join(directory, "originals", randomUUID());
  mkdirSync(folder, { recursive: true });
  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
  };
  let total = 0;
  for (const row of photos) {
    const id = String(row.id),
      mime = String(row.mime);
    try {
      if (!/^[a-f0-9-]{36}$/.test(id) || !extensions[mime])
        throw new Error("Foto incompatible con la revisión.");
      const path = join(folder, id + "." + extensions[mime]);
      const response = await fetch(
        origin + "/api/files/" + encodeURIComponent(id),
        {
          headers: { Cookie: cookie },
          signal: AbortSignal.timeout(120000),
          redirect: "error",
        },
      );
      const sha256 = await downloadOriginal(response, path, {
        size: Number(row.size),
        mime,
      });
      const info = await inspectFile(path, basename(path));
      if (info.kind !== "photo" || info.mime !== mime)
        throw new Error("El formato del original no coincide.");
      const capturedAt = await readPhotoClock(path);
      if (capturedAt)
        candidates.push({
          id,
          before: row,
          capturedAt,
          sha256,
          original: relative(directory, path),
        });
      else missing.push(id);
    } catch {
      failures.push({
        id,
        error: "No se pudo verificar el original; no se aplicará ninguna hora.",
      });
    }
    total++;
    if (total % 10 === 0 || total === photos.length)
      console.log(
        JSON.stringify({
          reviewed: total,
          total: photos.length,
          recoverable: candidates.length,
          withoutClock: missing.length,
          failed: failures.length,
        }),
      );
  }
  writeFileSync(
    join(directory, "proposal.json"),
    JSON.stringify(
      {
        schema: 1,
        scannedAt: new Date().toISOString(),
        candidates,
        missing,
        failures,
      },
      null,
      2,
    ),
  );
  console.log(
    "Revisión terminada sin modificar la base ni los originales remotos.",
  );
} else {
  const proposal = JSON.parse(
    readFileSync(join(directory, "proposal.json"), "utf8"),
  ) as { schema: number; candidates: Proposed[] };
  if (proposal.schema !== 1) throw new Error("Formato de propuesta inválido.");
  for (const item of proposal.candidates) {
    const path = resolve(directory, item.original);
    const inside = relative(directory, path);
    if (inside.startsWith("..") || isAbsolute(inside))
      throw new Error("Original fuera del respaldo privado.");
    if (
      createHash("sha256").update(readFileSync(path)).digest("hex") !==
        item.sha256 ||
      (await readPhotoClock(path)) !== item.capturedAt
    )
      throw new Error("La propuesta no coincide con los originales revisados.");
  }
  const url = new URL(process.env.DATABASE_URL!);
  for (const name of ["sslmode", "sslcert", "sslkey", "sslrootcert"])
    url.searchParams.delete(name);
  const client = new pg.Client({
    connectionString: url.toString(),
    ssl: {
      rejectUnauthorized: true,
      ca: readFileSync(process.env.DATABASE_CA!, "utf8"),
    },
  });
  await client.connect();
  try {
    const result = await applyPhotoClocks(
      (sql, values) => client.query(sql, values),
      proposal.candidates,
    );
    const report = JSON.stringify({ appliedAt: new Date().toISOString(), ...result }, null, 2);
    const reportPath = join(directory, "applied-" + randomUUID() + ".json");
    writeFileSync(reportPath, report, { flag: "wx" });
    try { writeFileSync(join(directory, "applied.json"), report, { flag: "wx" }); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error; }
    console.log(
      JSON.stringify({
        added: result.inserted.length,
        changedSkipped: result.skippedChanged,
        existingSkipped: result.skippedExisting,
      }),
    );
  } finally {
    await client.end();
  }
}
