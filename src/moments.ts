import type { Media } from "../shared/types";
// Calendar days, independent of daylight-saving changes and clock-hour differences.
function calendarDay(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NaN;
  const [y, m, d] = date.split("-").map(Number),
    value = Date.UTC(y, m - 1, d);
  return new Date(value).toISOString().slice(0, 10) === date ? value : NaN;
}
export function daysTogether(since: string, today: string) {
  const days = (calendarDay(today) - calendarDay(since)) / 86400000;
  return Number.isFinite(days) && days >= 0 ? days : null;
}
export function onThisDay(items: Media[], today: string) {
  return items
    .filter(
      (item) => item.date.slice(5) === today.slice(5) && item.date < today,
    )
    .sort((a, b) => b.date.localeCompare(a.date));
}
export function albumGroups(items: Media[]) {
  const groups = new Map<string, Media[]>();
  for (const item of items) {
    if (!item.album.trim()) continue;
    const group = groups.get(item.album) || [];
    group.push(item);
    groups.set(item.album, group);
  }
  return Array.from(groups, ([name, media]) => ({ name, media })).sort((a, b) =>
    a.name.localeCompare(b.name, "es"),
  );
}
