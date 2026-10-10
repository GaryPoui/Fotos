import type { Media } from "./types.js";

export function validCaptureDate(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    !/^[1-9]\d{3}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value)
  )
    return false;
  const date = new Date(value + "Z");
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 19) === value
  );
}
export function validCaptureOffset(value: unknown): value is string {
  if (typeof value !== "string" || !/^[+-]\d{2}:\d{2}$/.test(value))
    return false;
  const hour = Number(value.slice(1, 3)),
    minute = Number(value.slice(4));
  return minute < 60 && (hour < 14 || (hour === 14 && minute === 0));
}
// Uploads are instants; camera dates are wallclock strings and never go through UTC.
const uploadFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Argentina/Buenos_Aires",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});
export function uploadedClock(value: string): string {
  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) return "";
  const parts = uploadFormatter.formatToParts(instant);
  const get = (name: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === name)?.value;
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`;
}
export function memoryClock(item: Media): string {
  if (validCaptureDate(item.capturedAt)) return item.capturedAt;
  if (item.dateSource === "upload") return uploadedClock(item.createdAt);
  return item.date; // Historical manual dates have no known hour.
}
export type TimeFilter = {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
};
export const emptyTimeFilter = (): TimeFilter => ({
  year: "",
  month: "",
  day: "",
  hour: "",
  minute: "",
});
export function matchesTime(clock: string, filters: TimeFilter) {
  return (
    (!filters.year || clock.slice(0, 4) === filters.year) &&
    (!filters.month || clock.slice(5, 7) === filters.month) &&
    (!filters.day || clock.slice(8, 10) === filters.day) &&
    (!filters.hour || clock.slice(11, 13) === filters.hour) &&
    (!filters.minute || clock.slice(14, 16) === filters.minute)
  );
}
export function memoryTimeLabel(item: Media) {
  const time = memoryClock(item).slice(11, 16);
  return time ? " · " + time : "";
}
export function dateSourceLabel(item: Media) {
  return item.dateSource === "metadata"
    ? "Fecha original de la foto"
    : item.dateSource === "upload"
      ? "Sin fecha original: usamos la subida"
      : "Fecha guardada anteriormente · hora desconocida";
}
