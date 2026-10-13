import { describe, it, expect } from "vitest";
import {
  videoDescriptor,
  parseVideoParts,
  partKeys,
  byteRange,
} from "../server/video-parts.js";

const id = "12345678-1234-4123-8123-123456789abc";
describe("private video parts", () => {
  it("retains deterministic private UUID keys and rejects unsafe descriptors", () => {
    const key = videoDescriptor(id + ".mp4", 55_000_001);
    const parsed = parseVideoParts(key)!;
    expect(partKeys(parsed)).toHaveLength(6);
    expect(partKeys(parsed)).toEqual(partKeys(parsed));
    expect(new Set(partKeys(parsed)).size).toBe(6);
    expect(
      partKeys(
        parseVideoParts(videoDescriptor(id + ".webm", 200 * 1024 * 1024))!,
      ),
    ).toHaveLength(21);
    expect(() => videoDescriptor(id + ".mp4", 200 * 1024 * 1024 + 1)).toThrow();
    for (const part of partKeys(parsed))
      expect(part).toMatch(
        /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}\.mp4$/,
      );
    for (const value of [
      id + ".mp4",
      key.replace("55000001", "999999999"),
      "../" + key,
      key.replace(".mp4", ".jpg"),
    ])
      expect(parseVideoParts(value)).toBeNull();
  });
  it("interprets boundary, suffix and open ranges without exceeding original bytes", () => {
    expect(byteRange("bytes=9999998-10000003", 55_000_001)).toEqual({
      start: 9999998,
      end: 10000003,
      partial: true,
    });
    expect(byteRange("bytes=-3", 10)).toEqual({
      start: 7,
      end: 9,
      partial: true,
    });
    expect(byteRange("bytes=8-", 10)).toEqual({
      start: 8,
      end: 9,
      partial: true,
    });
    expect(byteRange("bytes=10-", 10)).toBeNull();
    expect(byteRange("bytes=0-1,4-5", 10)).toEqual({
      start: 0,
      end: 9,
      partial: false,
    });
  });
});
