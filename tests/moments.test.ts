import { it, expect } from "vitest";
import { daysTogether, onThisDay, albumGroups } from "../src/moments";
import type { Media } from "../shared/types";
const moment = (date: string, album = ""): Media => ({
  id: date,
  title: date,
  date,
  album,
  kind: "photo",
  tags: [],
  favorite: false,
  artist: "",
  mime: "image/png",
  size: 1,
  createdAt: "",
});
it("counts calendar days across DST/leap dates and rejects invalid/future dates", () => {
  expect(daysTogether("2024-02-28", "2024-03-01")).toBe(2);
  expect(daysTogether("2026-10-08", "2026-10-08")).toBe(0);
  expect(daysTogether("2026-03-07", "2026-03-09")).toBe(2);
  for (const date of ["", "2025-02-29", "2027-10-08", "invalid"])
    expect(daysTogether(date, "2026-10-08")).toBeNull();
});
it("selects same month/day only in past years, including leap-day memories", () => {
  expect(
    onThisDay(
      [
        moment("2025-10-08"),
        moment("2026-10-08"),
        moment("2027-10-08"),
        moment("2025-10-09"),
      ],
      "2026-10-08",
    ).map((m) => m.date),
  ).toEqual(["2025-10-08"]);
  expect(onThisDay([moment("2024-02-29")], "2028-02-29")).toHaveLength(1);
});
it("groups real albums without inventing empty ones", () => {
  const items = [
    moment("2020-01-01", "Viajes"),
    moment("2021-01-01", "Viajes"),
    moment("2021-02-01", "Salidas"),
    moment("2020-03-01"),
  ];
  expect(albumGroups(items).map((g) => [g.name, g.media.length])).toEqual([
    ["Salidas", 1],
    ["Viajes", 2],
  ]);
});
