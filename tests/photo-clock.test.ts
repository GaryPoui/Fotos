import { describe, expect, it } from "vitest";
import sharp from "sharp";
import {
  compareMedia,
  validCapturedAt,
  captureTime,
} from "../shared/photo-clock.js";
import { readCaptureMetadata } from "../shared/photo-metadata.js";
import type { Media } from "../shared/types.js";
import { readPhotoClock } from "../server/photo-clock.js";
const photo = (
  id: string,
  capturedAt?: string,
  createdAt = "2026-10-13T12:00:00Z",
): Media => ({
  id,
  kind: "photo",
  date: "2020-01-02",
  title: id,
  album: "",
  tags: [],
  favorite: false,
  artist: "",
  mime: "image/jpeg",
  size: 1,
  createdAt,
  ...(capturedAt ? { capturedAt } : {}),
});
describe("camera clock", () => {
  it("validates complete camera timestamps without inventing seconds or changing timezones", () => {
    for (const value of ["2024-02-29T23:59:59", "2025-01-01T00:00:00"])
      expect(validCapturedAt(value)).toBe(true);
    for (const value of [
      "2025-02-29T12:00:00",
      "2024-01-01T24:00:00",
      "2024-01-01T12:00",
      "2024-01-01T12:00:60",
      "2024-01-01T12:00:00Z",
      null,
      {},
    ])
      expect(validCapturedAt(value)).toBe(false);
    expect(captureTime(photo("a", "2024-02-29T23:59:59"))).toBe("23:59:59");
  });
  it("orders by manual day, camera seconds and stable upload fallback with unknown clocks last", () => {
    const a = photo("a", "2025-01-01T12:05:01"),
      b = photo("b", "1999-12-31T12:05:02"),
      c = photo("c", undefined, "2026-10-13T13:00:00Z"),
      d = photo("d", undefined, "2026-10-13T14:00:00Z");
    expect(
      [a, c, b, d].sort((x, y) => compareMedia(x, y)).map((x) => x.id),
    ).toEqual(["b", "a", "d", "c"]);
    expect(
      [a, c, b, d].sort((x, y) => compareMedia(x, y, "asc")).map((x) => x.id),
    ).toEqual(["a", "b", "d", "c"]);
    expect(compareMedia({ ...a, date: "2010-01-01" }, b)).toBeGreaterThan(0);
    expect(captureTime({ ...a, kind: "audio" })).toBeNull();
  });
  it("reads real EXIF original time and ignores modification time, offset and malformed images", async () => {
    const bytes = await sharp({
      create: { width: 12, height: 12, channels: 3, background: "#bbe0ee" },
    })
      .jpeg()
      .withExif({
        IFD2: {
          DateTimeOriginal: "2025:04:03 19:02:09",
          OffsetTimeOriginal: "+09:00",
          DateTimeDigitized: "2025:04:03 00:00:00",
        },
      })
      .toBuffer();
    expect(await readCaptureMetadata(bytes)).toBe("2025-04-03T19:02:09");
    const onlyModified = await sharp(bytes)
      .jpeg()
      .withExif({ IFD0: { DateTime: "2025:04:03 12:00:00" } })
      .toBuffer();
    expect(await readCaptureMetadata(onlyModified)).toBeNull();
    expect(await readCaptureMetadata(new Uint8Array([0, 1, 2]))).toBeNull();
  });
  it("reads embedded TIFF clocks from PNG and WebP even when their containers differ", async () => {
    for (const format of ["png", "webp"] as const) {
      const bytes = await sharp({
        create: { width: 12, height: 12, channels: 3, background: "pink" },
      })
        .toFormat(format)
        .withExif({ IFD2: { DateTimeOriginal: "2024:02:29 23:59:58" } })
        .toBuffer();
      expect(await readPhotoClock(bytes)).toBe("2024-02-29T23:59:58");
    }
  });
});
