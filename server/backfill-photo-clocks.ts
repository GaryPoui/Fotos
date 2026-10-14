import { createHash } from "node:crypto";
import { createWriteStream } from "node:fs";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { isDeepStrictEqual } from "node:util";
import { validCapturedAt } from "../shared/photo-clock.js";
export interface ClockCandidate {
  id: string;
  before: Record<string, unknown>;
  capturedAt: string;
}
export type ClockQuery = (
  sql: string,
  args?: unknown[],
) => Promise<{ rows: Record<string, unknown>[] }>;
export async function downloadOriginal(
  response: Response,
  path: string,
  expected: { size: number; mime: string },
) {
  if (
    response.status !== 200 ||
    !response.body ||
    response.headers.get("content-type")?.split(";")[0] !== expected.mime ||
    !Number.isSafeInteger(expected.size) ||
    expected.size <= 0 ||
    expected.size > 200 * 1024 * 1024 ||
    (response.headers.has("content-length") &&
      Number(response.headers.get("content-length")) !== expected.size)
  ) {
    await response.body?.cancel();
    throw new Error("El original no coincide con el archivo registrado.");
  }
  let length = 0;
  const hash = createHash("sha256");
  await pipeline(
    Readable.fromWeb(response.body as never),
    new Transform({
      transform(chunk: Buffer, _encoding, done) {
        length += chunk.length;
        if (length > expected.size) {
          done(new Error("El original excede el tamaño registrado."));
          return;
        }
        hash.update(chunk);
        done(null, chunk);
      },
    }),
    createWriteStream(path, { flags: "wx" }),
  );
  if (length !== expected.size)
    throw new Error("La descarga del original está incompleta.");
  return hash.digest("hex");
}
// query MUST belong to one checked-out connection for this entire transaction.
export async function applyPhotoClocks(
  query: ClockQuery,
  candidates: ClockCandidate[],
) {
  for (const item of candidates)
    if (
      !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(
        item.id,
      ) ||
      item.before.id !== item.id ||
      item.before.kind !== "photo" ||
      !validCapturedAt(item.capturedAt)
    )
      throw new Error("Propuesta horaria inválida.");
  const result = {
    inserted: [] as { id: string; capturedAt: string }[],
    skippedChanged: 0,
    skippedExisting: 0,
  };
  await query("BEGIN ISOLATION LEVEL REPEATABLE READ");
  try {
    const previous = {
      media: (await query("SELECT * FROM rincon.media ORDER BY id")).rows,
      notes: (await query("SELECT * FROM rincon.notes ORDER BY id")).rows,
      meta: (await query("SELECT * FROM rincon.meta ORDER BY key")).rows,
    };
    for (const item of candidates) {
      const row = (
        await query("SELECT * FROM rincon.media WHERE id=$1 FOR UPDATE", [
          item.id,
        ])
      ).rows[0];
      if (!row || !isDeepStrictEqual(row, item.before)) {
        result.skippedChanged++;
        continue;
      }
      const inserted = await query(
        "INSERT INTO rincon.meta (key,value) VALUES ($1,$2) ON CONFLICT(key) DO NOTHING RETURNING key",
        [
          "photo-clock:" + item.id,
          JSON.stringify({ capturedAt: item.capturedAt }),
        ],
      );
      if (inserted.rows.length)
        result.inserted.push({ id: item.id, capturedAt: item.capturedAt });
      else result.skippedExisting++;
    }
    for (const table of ["media", "notes"] as const)
      if (
        !isDeepStrictEqual(
          (await query("SELECT * FROM rincon." + table + " ORDER BY id")).rows,
          previous[table],
        )
      )
        throw new Error("La operación cambió una fila anterior.");
    const after = (await query("SELECT * FROM rincon.meta ORDER BY key")).rows;
    const oldKeys = new Set(previous.meta.map((row) => row.key));
    for (const row of previous.meta)
      if (
        !isDeepStrictEqual(
          after.find((next) => next.key === row.key),
          row,
        )
      )
        throw new Error("La operación cambió metadatos anteriores.");
    const added = after.filter((row) => !oldKeys.has(row.key));
    const expected = result.inserted
      .map((item) => ({
        key: "photo-clock:" + item.id,
        value: JSON.stringify({ capturedAt: item.capturedAt }),
      }))
      .sort((a, b) => a.key.localeCompare(b.key));
    if (!isDeepStrictEqual(added, expected))
      throw new Error("La operación añadió metadatos inesperados.");
    await query("COMMIT");
    return result;
  } catch (error) {
    await query("ROLLBACK").catch(() => {});
    throw error;
  }
}
