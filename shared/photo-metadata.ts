import { validCaptureDate, validCaptureOffset } from "./media-time.js";
export type CaptureMetadata = {
  capturedAt: string;
  captureOffset: string | null;
};
export function captureFromTags(
  tags: Record<string, unknown> | undefined,
): CaptureMetadata | null {
  if (!tags) return null;
  for (const [key, offset] of [
    ["DateTimeOriginal", "OffsetTimeOriginal"],
    ["CreateDate", "OffsetTimeDigitized"],
  ]) {
    const raw = tags[key];
    if (typeof raw !== "string") continue;
    const capturedAt = raw
      .trim()
      .replace(/^(\d{4}):(\d{2}):(\d{2}) /, "$1-$2-$3T");
    if (validCaptureDate(capturedAt))
      return {
        capturedAt,
        captureOffset: validCaptureOffset(tags[offset]) ? tags[offset] : null,
      };
  }
  return null;
}
export async function readCaptureMetadata(
  input: File | Uint8Array | string,
): Promise<CaptureMetadata | null> {
  try {
    const { parse } = await import("exifr");
    const tags = await parse(input, {
      pick: [
        "DateTimeOriginal",
        "CreateDate",
        "OffsetTimeOriginal",
        "OffsetTimeDigitized",
      ],
      reviveValues: false,
      translateKeys: true,
      translateValues: false,
      xmp: false,
      icc: false,
      iptc: false,
      jfif: false,
      ihdr: false,
    });
    return captureFromTags(tags);
  } catch {
    return null;
  }
}
