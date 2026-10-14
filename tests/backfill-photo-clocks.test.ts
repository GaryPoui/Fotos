import { afterEach, beforeEach, describe, it, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  applyPhotoClocks,
  downloadOriginal,
  type ClockCandidate,
} from "../server/backfill-photo-clocks.js";
let db: PGlite;
const id = "12345678-1234-4123-8123-123456789abc";
beforeEach(async () => {
  db = new PGlite();
  await db.exec(readFileSync("supabase/schema.sql", "utf8"));
  await db.query(
    "INSERT INTO rincon.media (id,kind,filename,mime,size,title,date,album,tags,artist,\"createdAt\",\"storedBytes\") VALUES ($1,'photo',$2,'image/jpeg',12,'Original title','2012-02-14','Old album','[]','','2026-01-01T00:00:00Z',12)",
    [id, id + ".jpg"],
  );
  await db.query(
    "INSERT INTO rincon.meta VALUES ('untouched','private existing value')",
  );
});
afterEach(async () => await db.close());
async function candidate(): Promise<ClockCandidate> {
  return {
    id,
    before: (
      await db.query<Record<string, unknown>>(
        "SELECT * FROM rincon.media WHERE id=$1",
        [id],
      )
    ).rows[0],
    capturedAt: "2025-04-03T12:30:02",
  };
}
describe("insert-only previous photo clocks", () => {
  it("preserves every raw field and previous metadata and is idempotent", async () => {
    const proposed = await candidate();
    const result = await applyPhotoClocks(
      (sql, args) => db.query(sql, args),
      [proposed],
    );
    expect(result.inserted).toHaveLength(1);
    expect(
      (await db.query("SELECT * FROM rincon.media WHERE id=$1", [id])).rows[0],
    ).toEqual(proposed.before);
    expect(
      (await db.query("SELECT * FROM rincon.meta WHERE key='untouched'"))
        .rows[0],
    ).toEqual({ key: "untouched", value: "private existing value" });
    expect(
      (await applyPhotoClocks((sql, args) => db.query(sql, args), [proposed]))
        .inserted,
    ).toEqual([]);
  });
  it("never replaces existing clocks, even malformed ones", async () => {
    const proposed = await candidate();
    await db.query("INSERT INTO rincon.meta VALUES ($1,'broken')", [
      "photo-clock:" + id,
    ]);
    expect(
      (await applyPhotoClocks((sql, args) => db.query(sql, args), [proposed]))
        .skippedExisting,
    ).toBe(1);
    expect(
      (
        await db.query("SELECT value FROM rincon.meta WHERE key=$1", [
          "photo-clock:" + id,
        ])
      ).rows[0],
    ).toEqual({ value: "broken" });
  });
  it("skips changed or deleted originals without touching their metadata", async () => {
    const proposed = await candidate();
    await db.query(
      "UPDATE rincon.media SET title='User correction' WHERE id=$1",
      [id],
    );
    expect(
      (await applyPhotoClocks((sql, args) => db.query(sql, args), [proposed]))
        .skippedChanged,
    ).toBe(1);
    await db.query("DELETE FROM rincon.media WHERE id=$1", [id]);
    expect(
      (await applyPhotoClocks((sql, args) => db.query(sql, args), [proposed]))
        .skippedChanged,
    ).toBe(1);
    expect(
      (
        await db.query(
          "SELECT key FROM rincon.meta WHERE key LIKE 'photo-clock:%'",
        )
      ).rows,
    ).toEqual([]);
  });
  it("rolls back insertions after a transaction failure and rejects invented/incomplete times", async () => {
    const proposed = await candidate();
    await expect(
      applyPhotoClocks(
        async (sql, args) => {
          const result = await db.query(sql, args);
          if (sql.startsWith("INSERT")) throw new Error("injected failure");
          return result;
        },
        [proposed],
      ),
    ).rejects.toThrow();
    expect(
      (
        await db.query(
          "SELECT key FROM rincon.meta WHERE key LIKE 'photo-clock:%'",
        )
      ).rows,
    ).toEqual([]);
    await expect(
      applyPhotoClocks(
        (sql, args) => db.query(sql, args),
        [{ ...proposed, capturedAt: "2025-04-03T12:30" }],
      ),
    ).rejects.toThrow();
  });
});
it("rejects partial, incorrect type, truncated and oversized downloads before application", async () => {
  const dir = mkdtempSync(join(tmpdir(), "rincon-clock-download-"));
  try {
    let i = 0;
    for (const response of [
      new Response(new Uint8Array(12), {
        status: 206,
        headers: { "content-type": "image/jpeg" },
      }),
      new Response(new Uint8Array(12), {
        headers: { "content-type": "image/png" },
      }),
      new Response(new Uint8Array(11), {
        headers: { "content-type": "image/jpeg" },
      }),
      new Response(new Uint8Array(13), {
        headers: { "content-type": "image/jpeg" },
      }),
    ])
      await expect(
        downloadOriginal(response, join(dir, String(i++)), {
          size: 12,
          mime: "image/jpeg",
        }),
      ).rejects.toThrow();
    expect(
      await downloadOriginal(
        new Response(new Uint8Array(12), {
          headers: { "content-type": "image/jpeg", "content-length": "12" },
        }),
        join(dir, "valid"),
        { size: 12, mime: "image/jpeg" },
      ),
    ).toMatch(/^[a-f0-9]{64}$/);
  } finally {
    if (!dir.startsWith(join(tmpdir(), "rincon-clock-download-")))
      throw new Error("Unexpected temporary path");
    rmSync(dir, { recursive: true, force: true });
  }
});
