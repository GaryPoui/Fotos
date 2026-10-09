// Conversion stays on the device. Only the resulting JPEG is uploaded.
export async function prepareImage(
  file: File,
  limit: number,
  onStage: (message: string) => void,
): Promise<File> {
  const header = new Uint8Array(await file.slice(0, 128).arrayBuffer());
  const text = String.fromCharCode(...header);
  const candidate =
    /\.(heic|heif)$/i.test(file.name) ||
    /^image\/hei[cf]/i.test(file.type) ||
    (text.slice(4, 8) === "ftyp" && /heic|heix|hevc|hevx/.test(text));
  if (!candidate) return file;
  if (file.size > 20_000_000)
    throw new Error(
      "Esta foto HEIC supera 20 MB. Exportala como JPEG desde Fotos para subirla.",
    );
  onStage("Convirtiendo foto de iPhone a JPEG…");
  // Bound declared HEIF item dimensions before allocating decoded pixels.
  const data = new Uint8Array(await file.arrayBuffer()),
    view = new DataView(data.buffer);
  function walk(start: number, end: number, depth = 0) {
    if (depth > 12)
      throw new Error("La estructura de esta foto no es compatible.");
    for (let pos = start; pos + 8 <= end; ) {
      const length = view.getUint32(pos),
        box = String.fromCharCode(...data.subarray(pos + 4, pos + 8));
      if (length < 8 || pos + length > end) break;
      if (box === "ispe" && length >= 20) {
        const width = view.getUint32(pos + 12),
          height = view.getUint32(pos + 16);
        if (!width || !height || width * height > 32_000_000)
          throw new Error(
            "Esta foto es demasiado grande para convertirla en el celular. Exportala como JPEG desde Fotos.",
          );
      }
      if (["meta", "iprp", "ipco"].includes(box))
        walk(pos + 8 + (box === "meta" ? 4 : 0), pos + length, depth + 1);
      pos += length;
    }
  }
  walk(0, data.byteLength);
  const { heicTo, isHeic } = await import("heic-to/csp");
  if (!(await isHeic(file)))
    throw new Error(
      "No pudimos reconocer esta foto HEIC. Exportala como JPEG desde Fotos.",
    );
  let result: Blob;
  try {
    result = await heicTo({ blob: file, type: "image/jpeg", quality: 0.9 });
  } catch {
    throw new Error(
      "No pudimos convertir esta foto. Probá exportarla como JPEG desde Fotos.",
    );
  }
  if (!result.size || result.size > limit)
    throw new Error(
      "El JPEG convertido supera el límite del álbum. Exportá una versión más pequeña.",
    );
  return new File([result], file.name.replace(/\.[^.]+$/, "") + ".jpg", {
    type: "image/jpeg",
    lastModified: file.lastModified,
  });
}
