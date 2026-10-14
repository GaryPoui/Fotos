import type { Media } from "./types.js";
export function validCapturedAt(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value)
  )
    return false;
  const time = new Date(value + "Z");
  return (
    Number.isFinite(time.getTime()) && time.toISOString().slice(0, 19) === value
  );
}
export function captureTime(item: Pick<Media, "kind" | "capturedAt">) {
  return item.kind === "photo" && validCapturedAt(item.capturedAt)
    ? item.capturedAt.slice(11)
    : null;
}
export function compareMedia(
  a: Media,
  b: Media,
  order: "asc" | "desc" = "desc",
) {
  const direction = order === "asc" ? 1 : -1;
  const day = a.date.localeCompare(b.date);
  if (day) return direction * day;
  const aTime = captureTime(a),
    bTime = captureTime(b);
  if (Boolean(aTime) !== Boolean(bTime)) return aTime ? -1 : 1;
  if (aTime && bTime) {
    const clock = aTime.localeCompare(bTime);
    if (clock) return direction * clock;
  }
  return b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id);
}
