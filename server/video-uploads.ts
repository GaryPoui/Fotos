import { randomUUID } from "node:crypto";
import type { Database } from "./database.js";
import type { ObjectStorage } from "./cloud-storage.js";
import { parseVideoParts } from "./video-parts.js";
const prefix = "video-upload:";
const stale = 60 * 60 * 1000;
export function videoUploads(db: Database, storage: ObjectStorage) {
  const owner = randomUUID();
  async function entries() {
    const rows = (await db
      .prepare("SELECT key,value FROM meta WHERE key LIKE 'video-upload:%'")
      .all()) as { key: string; value: string }[];
    return rows.flatMap((row) => {
      try {
        const value = JSON.parse(row.value) as {
          filename: string;
          owner: string;
          createdAt: string;
        };
        const parts = parseVideoParts(value.filename);
        const created = Date.parse(value.createdAt);
        if (
          !parts ||
          row.key !== prefix + parts.root.split(".")[0] ||
          !Number.isFinite(created) ||
          typeof value.owner !== "string"
        )
          return [];
        return [
          {
            ...row,
            ...value,
            size: parts.size,
            created,
            id: row.key.slice(prefix.length),
          },
        ];
      } catch {
        return [];
      }
    });
  }
  async function forget(id: string) {
    await db.prepare("DELETE FROM meta WHERE key=?").run(prefix + id);
  }
  return {
    forget,
    async reserved(exclude?: string) {
      let total = 0;
      for (const entry of await entries())
        if (
          entry.id !== exclude &&
          !(await db.prepare("SELECT id FROM media WHERE id=?").get(entry.id))
        )
          total += entry.size;
      return total;
    },
    async recover() {
      for (const entry of await entries()) {
        if (await db.prepare("SELECT id FROM media WHERE id=?").get(entry.id)) {
          await forget(entry.id);
          continue;
        }
        if (Date.now() - entry.created < stale) continue;
        try {
          await storage.remove([entry.filename]);
          await forget(entry.id);
        } catch {
          console.error("Quedó una subida pendiente de limpieza.");
        }
      }
    },
    async reserve(id: string, filename: string) {
      const previous = (await entries()).find((entry) => entry.id === id);
      if (previous) {
        if (previous.owner !== owner && Date.now() - previous.created < stale)
          return false;
        await storage.remove([previous.filename]);
        await forget(id);
      }
      await db
        .prepare("INSERT INTO meta (key,value) VALUES (?,?)")
        .run(
          prefix + id,
          JSON.stringify({
            filename,
            owner,
            createdAt: new Date().toISOString(),
          }),
        );
      return true;
    },
  };
}
