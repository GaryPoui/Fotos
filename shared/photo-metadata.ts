import { validCapturedAt } from "./photo-clock.js";
export async function readCaptureMetadata(
  input: File | Uint8Array,
): Promise<string | null> {
  try {
    const { parse } = await import("exifr");
    const tags = await parse(input, {
      pick: ["DateTimeOriginal"],
      reviveValues: false,
      translateKeys: true,
      translateValues: false,
      gps: false,
      xmp: false,
      icc: false,
      iptc: false,
      jfif: false,
      ihdr: false,
    });
    const raw: unknown = tags?.DateTimeOriginal;
    if (typeof raw !== "string") return null;
    const capturedAt = raw
      .replace(/\0+$/, "")
      .trim()
      .replace(/^(\d{4}):(\d{2}):(\d{2}) /, "$1-$2-$3T");
    return validCapturedAt(capturedAt) ? capturedAt : null;
  } catch {
    return null;
  }
}
