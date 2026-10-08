import { describe, it, expect } from "vitest";
import {
  mkdtempSync,
  mkdirSync,
  rmSync,
  readFileSync,
  writeFileSync,
  existsSync,
  utimesSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { openDb } from "../server/db.js";
import { backupData } from "../server/backup.js";
import { DatabaseSync } from "node:sqlite";
import { acquireLock } from "../server/lifecycle.js";
describe("Offline backup", () => {
  it("recovers a stale shared-volume lease after an unclean container stop", async () => {
    const root = mkdtempSync(join(tmpdir(), "rincon-stale-"));
    try {
      mkdirSync(join(root, ".server.lock"));
      const old = new Date(Date.now() - 20000);
      utimesSync(join(root, ".server.lock"), old, old);
      const release = await acquireLock(root, false);
      expect(existsSync(join(root, ".server.lock"))).toBe(true);
      await release();
      expect(existsSync(join(root, ".server.lock"))).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
  it("creates a restorable snapshot with files but without live sessions", async () => {
    const root = mkdtempSync(join(tmpdir(), "rincon-backup-")),
      data = join(root, "data");
    try {
      const db = openDb(data);
      mkdirSync(join(data, "media"));
      const id = "11111111-1111-4111-8111-111111111111";
      db.prepare(
        "INSERT INTO media (id,kind,filename,mime,size,title,date,createdAt) VALUES (?,?,?,?,?,?,?,?)",
      ).run(
        id,
        "photo",
        id + ".png",
        "image/png",
        5,
        "Recuerdo",
        "2026-10-07",
        new Date().toISOString(),
      );
      db.prepare("INSERT INTO sessions VALUES (?,?,?)").run(
        "hashed-token",
        Date.now() + 10000,
        "v1",
      );
      db.prepare("INSERT INTO notes VALUES (?,?,?,?,?,?,?,?)").run(
        "note",
        "letter",
        "Para vos",
        "Siempre",
        "Yo",
        "2026-10-07",
        0,
        new Date().toISOString(),
      );
      writeFileSync(join(data, "media", id + ".png"), "image");
      writeFileSync(join(data, "media", id + ".thumb.webp"), "thumb");
      db.close();
      const output = await backupData(data, join(root, "backups"));
      expect(existsSync(join(output, "COMPLETE"))).toBe(true);
      expect(readFileSync(join(output, "media", id + ".png"), "utf8")).toBe(
        "image",
      );
      const restored = new DatabaseSync(join(output, "rincon.sqlite"));
      try {
        expect(restored.prepare("SELECT * FROM sessions").all()).toHaveLength(
          0,
        );
        expect(restored.prepare("SELECT body FROM notes").get()).toMatchObject({
          body: "Siempre",
        });
        expect(restored.prepare("PRAGMA quick_check").get()).toMatchObject({
          quick_check: "ok",
        });
      } finally {
        restored.close();
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
  it("refuses a live server and a backup destination inside the data volume", async () => {
    const root = mkdtempSync(join(tmpdir(), "rincon-backup-"));
    try {
      const db = openDb(root);
      db.close();
      await expect(backupData(root, join(root, "bad"))).rejects.toThrow(
        "fuera de DATA_DIR",
      );
      const release = await acquireLock(root, false);
      try {
        await expect(
          backupData(root, join(tmpdir(), "unused-rincon-backup")),
        ).rejects.toThrow("servidor está activo");
      } finally {
        await release();
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
