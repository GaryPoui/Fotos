import { zipSync, strToU8 } from "fflate";
import type { Library, Media } from "../shared/types";
import { mediaUrl } from "./lib";
const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
};
export function backupParts(media: Media[], limit = 100_000_000): Media[][] {
  const parts: Media[][] = [[]];
  let size = 0;
  for (const item of media) {
    const stored =
      Number((item as Media & { storedBytes?: number }).storedBytes) ||
      item.size + (item.kind === "photo" ? 5_000_000 : 0);
    if (size && size + stored > limit) {
      parts.push([]);
      size = 0;
    }
    parts.at(-1)!.push(item);
    size += stored;
  }
  return parts;
}
export async function backupZip(
  library: Library,
  items: Media[],
  part: number,
  total: number,
  progress: (message: string) => void,
  signal?: AbortSignal,
  read: typeof fetch = fetch,
) {
  const files: Record<string, Uint8Array> = {};
  const manifest: { path: string; size: number; sha256: string }[] = [];
  const add = async (path: string, body: Uint8Array) => {
    files[path] = body;
    manifest.push({
      path,
      size: body.byteLength,
      sha256: Array.from(
        new Uint8Array(
          await crypto.subtle.digest("SHA-256", Uint8Array.from(body)),
        ),
      )
        .map((n) => n.toString(16).padStart(2, "0"))
        .join(""),
    });
  };
  for (const item of items) {
    if (!/^[a-f0-9-]+$/.test(item.id) || !extensions[item.mime])
      throw new Error(
        "Hay un archivo con formato desconocido. No se preparó esta parte.",
      );
    for (const thumb of item.kind === "photo" ? [false, true] : [false]) {
      signal?.throwIfAborted();
      progress("Descargando " + item.title + (thumb ? " · miniatura" : ""));
      const response = await read(mediaUrl(item.id, thumb), {
        cache: "no-store",
        signal,
      });
      if (!response.ok)
        throw new Error(
          "No pudimos descargar “" +
            item.title +
            "”. Volvé a intentar esta parte.",
        );
      const data = new Uint8Array(await response.arrayBuffer());
      if (!data.length || (!thumb && data.byteLength !== item.size))
        throw new Error(
          "El archivo “" +
            item.title +
            "” está incompleto. No se preparó esta parte.",
        );
      await add(
        "archivos/" +
          item.id +
          "/" +
          (thumb ? "miniatura.webp" : "original." + extensions[item.mime]),
        data,
      );
    }
  }
  for (const note of library.notes) {
    if (!/^[a-f0-9-]+$/.test(note.id))
      throw new Error("Identificador de carta inválido.");
    await add(
      "cartas/" + note.id + ".txt",
      strToU8(
        note.title +
          "\n" +
          note.date +
          " · " +
          note.author +
          "\n\n" +
          note.body,
      ),
    );
  }
  files["recuerdos.json"] = strToU8(
    JSON.stringify(
      {
        format: "nuestro-rincon",
        version: 1,
        exportedAt: new Date().toISOString(),
        part,
        totalParts: total,
        settings: library.settings,
        notes: library.notes,
        media: library.media,
        files: manifest,
      },
      null,
      2,
    ),
  );
  files["LEEME.txt"] = strToU8(
    "Nuestro rincón — copia privada\nConservá todas las partes del respaldo juntas. recuerdos.json contiene cartas, ajustes, metadatos y hashes SHA-256. Los originales y miniaturas de esta parte están en archivos/. Las cartas también se incluyen como texto legible. Este ZIP no tiene contraseña: guardalo en un lugar privado. No incluye sesiones ni contraseñas. No hay restauración automática; los archivos y textos pueden abrirse sin esta web.\n",
  );
  signal?.throwIfAborted();
  progress("Preparando ZIP…");
  return zipSync(files, { level: 0 });
}
