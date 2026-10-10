import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { PGlite } from "@electric-sql/pglite";
import { openDb } from "../server/db.js";
import {
  captureFromTags,
  readCaptureMetadata,
} from "../shared/photo-metadata.js";
import {
  validCaptureDate,
  validCaptureOffset,
  uploadedClock,
  memoryClock,
  matchesTime,
} from "../shared/media-time.js";
import type { Media } from "../shared/types.js";

const legacy = {
  id: "old",
  date: "2020-02-14",
  createdAt: "2026-10-10T01:45:30Z",
} as Media;
describe("Photo calendar metadata", () => {
  it("validates real calendar and clock, preserving wallclock and offset", () => {
    expect(
      captureFromTags({
        DateTimeOriginal: "2024:02:29 23:58:07",
        OffsetTimeOriginal: "-03:00",
      }),
    ).toEqual({ capturedAt: "2024-02-29T23:58:07", captureOffset: "-03:00" });
    expect(
      captureFromTags({
        DateTimeOriginal: "2023:02:29 24:60:00",
        CreateDate: "2021:12:31 00:01:02",
      }),
    ).toEqual({ capturedAt: "2021-12-31T00:01:02", captureOffset: null });
    expect(captureFromTags({ ModifyDate: "2020:01:01 12:00:00" })).toBeNull();
    for (const value of [
      "2023-02-29T12:00:00",
      "2024-01-01T24:00:00",
      "0000-01-01T00:00:00",
      "2024-01-01T00:60:00",
      "2024-01-01T00:00:60",
      "2024-01-01T00:00:00Z",
    ])
      expect(validCaptureDate(value)).toBe(false);
    expect(validCaptureDate("2024-02-29T23:59:59")).toBe(true);
    for (const value of ["+14:01", "+25:00", "03:00", "-03:60"])
      expect(validCaptureOffset(value)).toBe(false);
    expect(validCaptureOffset("+14:00")).toBe(true);
  });
  it("reads real original EXIF and falls back for absent or damaged metadata", async () => {
    const image = await sharp({
      create: { width: 20, height: 20, channels: 3, background: "#f3d6e5" },
    })
      .withExif({
        IFD0: {},
        IFD2: {
          DateTimeOriginal: "2020:12:31 23:58:07",
          OffsetTimeOriginal: "-03:00",
        },
      })
      .jpeg()
      .toBuffer();
    expect(await readCaptureMetadata(image)).toEqual({
      capturedAt: "2020-12-31T23:58:07",
      captureOffset: "-03:00",
    });
    const noExif = await sharp(image).png().toBuffer();
    expect(await readCaptureMetadata(noExif)).toBeNull();
    expect(await readCaptureMetadata(new Uint8Array([0, 1, 2]))).toBeNull();
  });
  it("filters capture minutes, preserves unknown legacy hours and separates upload time", () => {
    expect(uploadedClock(legacy.createdAt)).toBe("2026-10-09T22:45:30");
    expect(memoryClock(legacy)).toBe("2020-02-14");
    expect(
      matchesTime(memoryClock(legacy), {
        year: "2020",
        month: "02",
        day: "14",
        hour: "",
        minute: "",
      }),
    ).toBe(true);
    expect(
      matchesTime(memoryClock(legacy), {
        year: "",
        month: "",
        day: "",
        hour: "00",
        minute: "",
      }),
    ).toBe(false);
    const item = {
      ...legacy,
      capturedAt: "2020-02-14T00:01:00",
      dateSource: "metadata" as const,
    };
    expect(memoryClock(item)).toBe(item.capturedAt);
    expect(
      matchesTime(memoryClock(item), {
        year: "2020",
        month: "02",
        day: "14",
        hour: "00",
        minute: "01",
      }),
    ).toBe(true);
    expect(
      matchesTime(memoryClock(item), {
        year: "2020",
        month: "02",
        day: "14",
        hour: "00",
        minute: "02",
      }),
    ).toBe(false);
  });
});

describe("Non-destructive chronology storage", () => {
  it("reopens SQLite and stores optional chronology without changing historical rows or notes", () => {
    const dir = mkdtempSync(join(tmpdir(), "rincon-metadata-"));
    const old = new DatabaseSync(join(dir, "rincon.sqlite"));
    old.exec(`CREATE TABLE media (id TEXT PRIMARY KEY,kind TEXT,filename TEXT,mime TEXT,size INTEGER,title TEXT,date TEXT,album TEXT,tags TEXT,favorite INTEGER,artist TEXT,createdAt TEXT,storedBytes INTEGER);
      INSERT INTO media VALUES ('old','photo','original.jpg','image/jpeg',15,'Título intacto','2020-02-14','Álbum intacto','[]',1,'','2026-10-09T15:00:00Z',15);
      CREATE TABLE notes(id TEXT PRIMARY KEY,body TEXT); INSERT INTO notes VALUES ('letter','Carta intacta');`);
    const before = old.prepare("SELECT * FROM media").get();
    old.close();
    try {
      for (let i = 0; i < 2; i++) {
        const db = openDb(dir);
        const row = db.prepare("SELECT * FROM media").get() as Record<
          string,
          unknown
        >;
        expect(row).toEqual(before);
        expect(row).not.toHaveProperty("capturedAt");
        db.prepare(
          "INSERT INTO meta VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
        ).run(
          "capture:new",
          JSON.stringify({
            capturedAt: "2021-02-14T23:58:07",
            captureOffset: null,
            dateSource: "metadata",
          }),
        );
        expect(db.prepare("SELECT * FROM media").get()).toEqual(before);
        expect(db.prepare("SELECT body FROM notes").get()).toEqual({
          body: "Carta intacta",
        });
        db.close();
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
  it("stores optional PostgreSQL chronology with existing permissions, preserving every previous field", async () => {
    const pg = new PGlite();
    try {
      await pg.exec(readFileSync("supabase/schema.sql", "utf8"));
      await pg.exec(
        `INSERT INTO rincon.media (id,kind,filename,mime,size,title,date,album,tags,favorite,artist,"createdAt","storedBytes") VALUES ('old','photo','same.jpg','image/jpeg',1,'Título intacto','2020-02-14','Álbum','[]',1,'','2026-10-09T15:00:00Z',1)`,
      );
      const before = (await pg.query("SELECT * FROM rincon.media")).rows;
      expect(before[0]).not.toHaveProperty("capturedAt");
      // A backend role with DML permission only; no schema ownership or DDL grants.
      await pg.exec(
        "CREATE ROLE backend; GRANT USAGE ON SCHEMA rincon TO backend; GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA rincon TO backend; CREATE POLICY backend_meta ON rincon.meta TO backend USING (true) WITH CHECK (true); CREATE POLICY backend_media ON rincon.media TO backend USING (true) WITH CHECK (true); SET ROLE backend",
      );
      for (let i = 0; i < 2; i++)
        await pg.query(
          "INSERT INTO rincon.meta VALUES ($1,$2) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
          [
            "capture:new",
            JSON.stringify({
              capturedAt: "2021-02-14T23:58:07",
              captureOffset: null,
              dateSource: "metadata",
            }),
          ],
        );
      const after = (await pg.query("SELECT * FROM rincon.media"))
        .rows as Record<string, unknown>[];
      expect(after).toEqual(before);
      expect(
        (
          await pg.query(
            "SELECT value FROM rincon.meta WHERE key='capture:new'",
          )
        ).rows,
      ).toHaveLength(1);
    } finally {
      await pg.close();
    }
  });
});
