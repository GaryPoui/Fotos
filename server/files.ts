import { fileTypeFromFile } from "file-type";
import sharp from "sharp";
import { join } from "node:path";
import type { MediaKind } from "../shared/types.js";
const allowed: Record<string, { kind: MediaKind; ext: string }> = {
  "image/jpeg": { kind: "photo", ext: "jpg" },
  "image/png": { kind: "photo", ext: "png" },
  "image/webp": { kind: "photo", ext: "webp" },
  "image/gif": { kind: "photo", ext: "gif" },
  "image/avif": { kind: "photo", ext: "avif" },
  "video/mp4": { kind: "video", ext: "mp4" },
  "video/webm": { kind: "video", ext: "webm" },
  "audio/mpeg": { kind: "audio", ext: "mp3" },
  "audio/wav": { kind: "audio", ext: "wav" },
  "audio/ogg": { kind: "audio", ext: "ogg" },
  "audio/opus": { kind: "audio", ext: "ogg" },
  "audio/x-m4a": { kind: "audio", ext: "m4a" },
  "audio/mp4": { kind: "audio", ext: "m4a" },
};
export async function inspectFile(path: string, originalName: string) {
  const detected = await fileTypeFromFile(path);
  if (!detected || !allowed[detected.mime])
    throw new Error("Formato no compatible. Elegí una foto, video o canción.");
  const info = { ...allowed[detected.mime], mime: detected.mime };
  // ISO-BMFF audio can be reported as video/mp4. Honor only an audio container extension.
  if (detected.mime === "video/mp4" && /\.m4a$/i.test(originalName)) {
    info.kind = "audio";
    info.ext = "m4a";
    info.mime = "audio/mp4";
  }
  if (info.kind === "photo")
    await sharp(path, { limitInputPixels: 40_000_000 }).metadata();
  return info;
}
export async function thumbnail(path: string, mediaDir: string, id: string) {
  await sharp(path, { limitInputPixels: 40_000_000 })
    .rotate()
    .resize(800, 1000, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(join(mediaDir, id + ".thumb.webp"));
}
