import { DatabaseSync } from "node:sqlite";
import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { copyFile } from "node:fs/promises";
import { join, resolve, sep, basename } from "node:path";
import { randomUUID } from "node:crypto";
import { acquireLock } from "./lifecycle.js";
export async function backupData(dataDir: string, backupRoot: string) {
  const dir = resolve(dataDir),
    root = resolve(backupRoot);
  if (root === dir || root.startsWith(dir + sep))
    throw new Error("El respaldo debe quedar fuera de DATA_DIR.");
  if (!existsSync(join(dir, "rincon.sqlite")))
    throw new Error("Todavía no hay una base de datos para respaldar.");
  const release = await acquireLock(dir, false);
  const output = join(
    root,
    new Date().toISOString().replace(/[:.]/g, "-") +
      "-" +
      randomUUID().slice(0, 8),
  );
  let db: DatabaseSync | undefined;
  try {
    mkdirSync(join(output, "media"), { recursive: true });
    db = new DatabaseSync(join(dir, "rincon.sqlite"));
    const check = db.prepare("PRAGMA quick_check").get() as Record<
      string,
      string
    >;
    if (Object.values(check)[0] !== "ok")
      throw new Error("SQLite no superó el control de integridad.");
    const rows = db
      .prepare("SELECT id,filename,kind FROM media")
      .all() as unknown as { id: string; filename: string; kind: string }[];
    db.prepare("VACUUM INTO ?").run(join(output, "rincon.sqlite"));
    for (const row of rows) {
      if (
        basename(row.filename) !== row.filename ||
        !/^[a-f0-9-]+\.[a-z0-9]+$/.test(row.filename)
      )
        throw new Error("Nombre de archivo inválido en la base.");
      await copyFile(
        join(dir, "media", row.filename),
        join(output, "media", row.filename),
      );
      if (row.kind === "photo")
        await copyFile(
          join(dir, "media", row.id + ".thumb.webp"),
          join(output, "media", row.id + ".thumb.webp"),
        );
    }
    const snapshot = new DatabaseSync(join(output, "rincon.sqlite"));
    try {
      snapshot.exec("DELETE FROM sessions; PRAGMA journal_mode=DELETE;");
    } finally {
      snapshot.close();
    }
    writeFileSync(
      join(output, "manifest.json"),
      JSON.stringify(
        {
          version: 1,
          createdAt: new Date().toISOString(),
          mediaCount: rows.length,
          sessionsIncluded: false,
        },
        null,
        2,
      ),
    );
    writeFileSync(
      join(output, "COMPLETE"),
      "Respaldo completo. Conservar de forma privada.\n",
    );
  } finally {
    db?.close();
    await release();
  }
  return output;
}
