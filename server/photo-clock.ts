import sharp from "sharp";
import type { Database } from "./database.js";
import type { Media } from "../shared/types.js";
import { readCaptureMetadata } from "../shared/photo-metadata.js";
import { validCapturedAt } from "../shared/photo-clock.js";
const prefix = "photo-clock:";
export async function readPhotoClock(path: string | Buffer) {
  try {
    const { exif } = await sharp(path, {
      limitInputPixels: 40_000_000,
    }).metadata();
    if (!exif) return null;
    const tiff = exif.subarray(0, 6).equals(Buffer.from("Exif\0\0"))
      ? exif.subarray(6)
      : exif;
    return await readCaptureMetadata(tiff);
  } catch {
    return null;
  }
}
export function photoClocks(db: Database) {
  function decode(raw?: string) {
    try {
      const value = JSON.parse(raw || "null");
      return validCapturedAt(value?.capturedAt)
        ? (value.capturedAt as string)
        : undefined;
    } catch {
      return undefined;
    }
  }
  return {
    async save(id: string, capturedAt: string) {
      if (!validCapturedAt(capturedAt))
        throw new Error("Hora de cámara inválida.");
      await db
        .prepare(
          "INSERT INTO meta (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
        )
        .run(prefix + id, JSON.stringify({ capturedAt }));
    },
    async remove(id: string) {
      await db.prepare("DELETE FROM meta WHERE key=?").run(prefix + id);
    },
    async enrich(item: Media) {
      if (item.kind !== "photo") return item;
      const row = (await db
        .prepare("SELECT value FROM meta WHERE key=?")
        .get(prefix + item.id)) as { value: string } | undefined;
      const capturedAt = decode(row?.value);
      return capturedAt ? { ...item, capturedAt } : item;
    },
    async list(items: Media[]) {
      const rows = (await db
        .prepare("SELECT key,value FROM meta WHERE key LIKE 'photo-clock:%'")
        .all()) as { key: string; value: string }[];
      const clocks = new Map(
        rows.map((row) => [row.key.slice(prefix.length), decode(row.value)]),
      );
      return items.map((item) => {
        const capturedAt = clocks.get(item.id);
        return item.kind === "photo" && capturedAt
          ? { ...item, capturedAt }
          : item;
      });
    },
  };
}
