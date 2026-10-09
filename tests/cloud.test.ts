import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import request from "supertest";
import express from "express";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "../server/app.js";
import { queryDatabase, type Database } from "../server/database.js";
import { cloudStorage } from "../server/cloud-storage.js";
import type { Server } from "node:http";

const headers = { "X-Requested-With": "NuestroRincon" };
const png = readFileSync(new URL("./fixtures/cielo.png", import.meta.url));
const password = "test-cloud-password";
let pg: PGlite, database: Database, dir: string, http: Server;
let runtime: Awaited<ReturnType<typeof createApp>>;
let files: Map<string, Buffer>,
  failUpload: boolean,
  publicBucket: boolean,
  url: string;
beforeEach(async () => {
  pg = new PGlite();
  await pg.exec(readFileSync("supabase/schema.sql", "utf8"));
  database = queryDatabase(
    (sql, params) => pg.query(sql, params),
    () => {},
  );
  files = new Map();
  failUpload = false;
  publicBucket = false;
  const storage = express();
  storage.use((req, res, next) => {
    if (
      req.get("apikey") !== "test-service-key" ||
      req.get("authorization") !== "Bearer test-service-key"
    ) {
      res.sendStatus(403);
      return;
    }
    next();
  });
  storage.get("/storage/v1/bucket/recuerdos", (_req, res) =>
    res.json({ public: publicBucket }),
  );
  storage.post(
    "/storage/v1/object/recuerdos/:key",
    express.raw({ type: "*/*", limit: "1mb" }),
    async (req, res) => {
      if (failUpload) {
        res.status(500).send("private provider detail");
        return;
      }
      // Delay forces concurrent uploads to overlap if application serialization fails.
      await new Promise((resolve) => setTimeout(resolve, 25));
      files.set(String(req.params.key), req.body);
      res.json({ Key: req.params.key });
    },
  );
  storage.delete("/storage/v1/object/recuerdos", express.json(), (req, res) => {
    for (const key of req.body.prefixes) files.delete(key);
    res.json([]);
  });
  storage.get("/storage/v1/object/authenticated/recuerdos/:key", (req, res) => {
    const file = files.get(String(req.params.key));
    if (!file) {
      res.sendStatus(404);
      return;
    }
    res.set("Accept-Ranges", "bytes");
    const range = req.get("Range");
    if (range) {
      const start = Number(range.match(/bytes=(\d+)/)?.[1]);
      if (!Number.isFinite(start) || start >= file.length) {
        res.set("Content-Range", "bytes */" + file.length).sendStatus(416);
        return;
      }
      const end = Math.min(
        Number(range.match(/-(\d+)/)?.[1] || file.length - 1),
        file.length - 1,
      );
      res
        .status(206)
        .set("Content-Range", `bytes ${start}-${end}/${file.length}`)
        .send(file.subarray(start, end + 1));
    } else res.send(file);
  });
  http = storage.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => http.once("listening", resolve));
  url = "http://127.0.0.1:" + (http.address() as { port: number }).port;
  dir = mkdtempSync(join(tmpdir(), "rincon-cloud-"));
  runtime = await start();
});
async function start(maxStorageBytes = 900_000_000) {
  return createApp({
    dataDir: dir,
    password,
    database,
    objectStorage: cloudStorage(url, "test-service-key"),
    maxStorageBytes,
  });
}
afterEach(async () => {
  await runtime?.close();
  await new Promise<void>((resolve, reject) =>
    http.close((error) => (error ? reject(error) : resolve())),
  );
  await pg.close();
  rmSync(dir, { recursive: true, force: true });
});
async function login() {
  const result = await request(runtime.app)
    .post("/api/login")
    .set(headers)
    .send({ password })
    .expect(200);
  return result.headers["set-cookie"][0].split(";")[0];
}
function upload(cookie: string) {
  return request(runtime.app)
    .post("/api/media")
    .set(headers)
    .set("Cookie", cookie)
    .attach("file", png, "cielo.png");
}

describe("Free hosting persistence", () => {
  it("keeps photos, thumbnails, letters, settings and sessions after replacing staging; proxies ranges privately", async () => {
    const cookie = await login();
    const photo = await upload(cookie).expect(201);
    expect(photo.body.storedBytes).toBeUndefined();
    await request(runtime.app)
      .post("/api/notes")
      .set(headers)
      .set("Cookie", cookie)
      .send({
        type: "letter",
        title: "Persistencia",
        body: "Carta sintética",
        date: "2026-10-08",
      })
      .expect(201);
    await request(runtime.app)
      .patch("/api/settings")
      .set(headers)
      .set("Cookie", cookie)
      .send({ names: "Ailu y Tomy", title: "Juntos", since: "" })
      .expect(200);
    expect(files.size).toBe(2);
    expect(readdirSync(join(dir, "media"))).toEqual([]);
    expect(readdirSync(join(dir, "tmp"))).toEqual([]);
    await runtime.close();
    rmSync(dir, { recursive: true, force: true });
    runtime = await start();
    const library = await request(runtime.app)
      .get("/api/library")
      .set("Cookie", cookie)
      .expect(200);
    expect(library.body.notes[0].body).toBe("Carta sintética");
    expect(library.body.settings.title).toBe("Juntos");
    expect(library.body.storage.used).toBeGreaterThan(png.length);
    await request(runtime.app)
      .get("/api/files/" + photo.body.id)
      .expect(401);
    const full = await request(runtime.app)
      .get("/api/files/" + photo.body.id)
      .set("Cookie", cookie)
      .expect(200);
    expect(full.body).toEqual(png);
    await request(runtime.app)
      .get("/api/files/" + photo.body.id + "?thumb=1")
      .set("Cookie", cookie)
      .expect(200)
      .expect("Content-Type", /image\/webp/);
    await request(runtime.app)
      .get("/api/files/" + photo.body.id)
      .set("Cookie", cookie)
      .set("Range", "bytes=0-9")
      .expect(206)
      .expect("Content-Range", `bytes 0-9/${png.length}`);
    await request(runtime.app)
      .get("/api/files/" + photo.body.id)
      .set("Cookie", cookie)
      .set("Range", "bytes=999999-")
      .expect(416);
    await request(runtime.app)
      .patch("/api/media/" + photo.body.id)
      .set(headers)
      .set("Cookie", cookie)
      .send({ favorite: true })
      .expect(200);
    await request(runtime.app)
      .delete("/api/media/" + photo.body.id)
      .set(headers)
      .set("Cookie", cookie)
      .expect(204);
    expect(files.size).toBe(0);
  });
  it("cleans staging and metadata on a rejected cloud upload without exposing provider errors", async () => {
    const cookie = await login();
    failUpload = true;
    const failed = await upload(cookie).expect(500);
    expect(JSON.stringify(failed.body)).not.toContain(
      "private provider detail",
    );
    const library = await request(runtime.app)
      .get("/api/library")
      .set("Cookie", cookie);
    expect(library.body.media).toEqual([]);
    expect(readdirSync(join(dir, "tmp"))).toEqual([]);
    expect(readdirSync(join(dir, "media"))).toEqual([]);
  });
  it("serializes concurrent uploads and counts thumbnails in the quota", async () => {
    const cookie = await login();
    const first = await upload(cookie).expect(201);
    const usage = (
      await request(runtime.app).get("/api/library").set("Cookie", cookie)
    ).body.storage.used;
    await request(runtime.app)
      .delete("/api/media/" + first.body.id)
      .set(headers)
      .set("Cookie", cookie)
      .expect(204);
    await runtime.close();
    runtime = await start(usage);
    const results = await Promise.all([upload(cookie), upload(cookie)]);
    expect(results.map((result) => result.status).sort()).toEqual([201, 413]);
    expect(files.size).toBe(2);
    await runtime.close();
    runtime = await start(png.length);
    await request(runtime.app)
      .delete(
        "/api/media/" +
          results.find((result) => result.status === 201)!.body.id,
      )
      .set(headers)
      .set("Cookie", cookie)
      .expect(204);
    await upload(cookie).expect(413);
  });
  it("refuses a public bucket and incomplete remote persistence", async () => {
    publicBucket = true;
    await expect(start()).rejects.toThrow("privado");
    await expect(
      createApp({ dataDir: dir, password, databaseUrl: "postgres://invalid" }),
    ).rejects.toThrow("requiere");
  });
  it("keeps all tables in a private schema with RLS enabled", async () => {
    const result = await pg.query<{ relrowsecurity: boolean }>(
      "SELECT relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='rincon' AND c.relkind='r'",
    );
    expect(result.rows).toHaveLength(4);
    expect(result.rows.every((row) => row.relrowsecurity)).toBe(true);
  });
});
