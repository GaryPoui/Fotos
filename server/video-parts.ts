import { createHash } from "node:crypto";
import { MAX_VIDEO_BYTES, VIDEO_PART_BYTES } from "../shared/storage.js";
const uuid =
  "[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}";
const pattern = new RegExp(
  "^(" + uuid + "\\.(?:mp4|webm))\\.parts-v1-([0-9]+)-([0-9]+)$",
);
export interface VideoParts {
  root: string;
  partBytes: number;
  size: number;
  count: number;
}
export function parseVideoParts(key: string): VideoParts | null {
  const match = pattern.exec(key);
  if (!match) return null;
  const partBytes = Number(match[2]),
    size = Number(match[3]),
    count = Math.ceil(size / partBytes);
  if (
    !Number.isSafeInteger(size) ||
    !Number.isSafeInteger(partBytes) ||
    size <= 0 ||
    size > MAX_VIDEO_BYTES ||
    partBytes <= 0 ||
    partBytes > 45_000_000 ||
    count < 2 ||
    count > 21
  )
    return null;
  return { root: match[1], partBytes, size, count };
}
export function videoDescriptor(root: string, size: number) {
  const key = root + ".parts-v1-" + VIDEO_PART_BYTES + "-" + size;
  if (!parseVideoParts(key)) throw new Error("Video inválido.");
  return key;
}
export function partKeys(parts: VideoParts) {
  return Array.from({ length: parts.count }, (_, index) => {
    const hex = createHash("sha256")
      .update(
        `rincon-video-v1:${parts.root}:${parts.partBytes}:${parts.size}:${index}`,
      )
      .digest("hex")
      .slice(0, 32)
      .split("");
    hex[12] = "4";
    hex[16] = "89ab"[parseInt(hex[16], 16) % 4];
    const value = hex.join("");
    return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}.${parts.root.split(".")[1]}`;
  });
}
export function byteRange(
  header: string | undefined,
  size: number,
): { start: number; end: number; partial: boolean } | null {
  const full = { start: 0, end: size - 1, partial: false };
  if (!header || !header.startsWith("bytes=") || header.includes(","))
    return full;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (!match[1] && !match[2])) return null;
  const a = Number(match[1]),
    b = Number(match[2]);
  if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b)) return null;
  const start = match[1] ? a : Math.max(0, size - b);
  const end = match[1] && match[2] ? Math.min(b, size - 1) : size - 1;
  return start > end || start >= size ? null : { start, end, partial: true };
}
