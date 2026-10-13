export const MAX_VIDEO_BYTES = 200 * 1024 * 1024;
export const VIDEO_PART_BYTES = 10_000_000;
export function availableBytes(storage: {
  used: number;
  limit: number;
  available?: number;
}) {
  return Math.max(0, storage.available ?? storage.limit - storage.used);
}
export function fileLimit(
  file: Pick<File, "name" | "type">,
  maxFile: number,
  maxVideo = maxFile,
) {
  return file.type.startsWith("video/") || /\.(mp4|webm)$/i.test(file.name)
    ? maxVideo
    : maxFile;
}
