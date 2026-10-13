import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import request from "supertest";
import express from "express";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import { videoDescriptor, parseVideoParts, partKeys } from "../server/video-parts.js";
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
let failPartAfter: number, uploadedParts: number, failDelete: boolean, ignoreRange: boolean;
let loseInsertResponse: boolean;
beforeEach(async () => {
  pg = new PGlite();
  await pg.exec(readFileSync("supabase/schema.sql", "utf8"));
  database = queryDatabase(
    async (sql, params) => {
      const result = await pg.query(sql,params);
      if (loseInsertResponse && sql.startsWith("INSERT INTO rincon.media ")) { loseInsertResponse=false; throw new Error("Simulated lost commit response"); }
      return result;
    },
    () => {},
  );
  files = new Map();
  failUpload = false;
  publicBucket = false;
  failPartAfter = Infinity; uploadedParts = 0; failDelete = false; ignoreRange = false;
  loseInsertResponse=false;
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
    express.raw({ type: "*/*", limit: "50mb" }),
    async (req, res) => {
      if (failUpload || ++uploadedParts > failPartAfter) {
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
    if (failDelete) { res.sendStatus(503); return; }
    expect(req.body.prefixes.length).toBeLessThanOrEqual(20);
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
    if (range && !ignoreRange) {
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
    maxFileBytes: 50_000_000,
    maxVideoFileBytes: 200 * 1024 * 1024,
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
  it("stores a playable >50MB original privately and reconstructs exact bytes, ranges and backups after restart", async () => {
    const cookie = await login();
    const photo = await upload(cookie).field("title", "Existing photo").expect(201);
    const before = (await pg.query("SELECT * FROM rincon.media WHERE id=$1", [photo.body.id])).rows;
    const original = readFileSync(new URL("./fixtures/recuerdo.mp4", import.meta.url));
    const padding = Buffer.alloc(55_000_001 - original.length); padding.writeUInt32BE(padding.length); padding.write("free", 4);
    const video = Buffer.concat([original, padding]), path = join(dir, "large.mp4"); writeFileSync(path, video);
    const id = randomUUID();
    const result = await request(runtime.app).post("/api/media").set(headers).set("Cookie", cookie).set("X-Upload-Id", id).field("title", "Synthetic large video").attach("file", path).expect(201);
    expect(result.body.size).toBe(video.length);
    const keys = partKeys(parseVideoParts(videoDescriptor(id + ".mp4", video.length))!);
    expect(keys.every(key => files.has(key))).toBe(true);
    expect(keys.map(key => files.get(key)!.length)).toEqual([10_000_000,10_000_000,10_000_000,10_000_000,10_000_000,5_000_001]);
    expect((await pg.query("SELECT key FROM rincon.meta WHERE key LIKE 'video-upload:%'")).rows).toEqual([]);
    await pg.query("INSERT INTO rincon.meta (key,value) VALUES ($1,$2)",["video-upload:"+id,JSON.stringify({filename:videoDescriptor(id+".mp4",video.length),owner:randomUUID(),createdAt:new Date(0).toISOString()})]);
    await runtime.close(); runtime = await start();
    expect(keys.every(key => files.has(key))).toBe(true); // Recovery must never remove a confirmed original.
    expect((await pg.query("SELECT key FROM rincon.meta WHERE key LIKE 'video-upload:%'")).rows).toEqual([]);
    const response = await request(runtime.app).get("/api/files/" + id).set("Cookie", cookie).expect(200);
    expect(createHash("sha256").update(response.body).digest("hex")).toBe(createHash("sha256").update(video).digest("hex"));
    for (const [range,start,end] of [["bytes=9999998-10000003",9999998,10000003],["bytes=-7",video.length-7,video.length-1],["bytes=55000000-",55000000,55000000]] as const) {
      const part = await request(runtime.app).get("/api/files/"+id).set("Cookie",cookie).set("Range",range).expect(206);
      expect(part.body).toEqual(video.subarray(start,end+1)); expect(part.headers["content-range"]).toBe(`bytes ${start}-${end}/${video.length}`);
    }
    const head = await request(runtime.app).head("/api/files/"+id).set("Cookie",cookie).set("Range","bytes=0-1").expect(200);
    expect(head.headers["content-length"]).toBe(String(video.length));
    await request(runtime.app).get("/api/files/"+id).set("Cookie",cookie).set("Range","bytes=55000001-").expect(416);
    await request(runtime.app).post("/api/media").set(headers).set("Cookie",cookie).set("X-Upload-Id",id).attach("file", original,"retry.mp4").expect(200);
    const library = (await request(runtime.app).get("/api/library").set("Cookie",cookie)).body;
    expect(library.storage.available).toBe(library.storage.limit-library.storage.used);
    expect(library.storage.maxVideoFile).toBe(200*1024*1024);
    ignoreRange = true;
    await request(runtime.app).get("/api/files/"+id).set("Cookie",cookie).set("Range","bytes=1-7").expect(502);
    ignoreRange = false;
    const second = files.get(keys[1])!; files.delete(keys[1]);
    await request(runtime.app).get("/api/files/"+id).set("Cookie",cookie).set("Range","bytes=10000000-10000007").expect(502);
    await expect(request(runtime.app).get("/api/files/"+id).set("Cookie",cookie).timeout(10_000)).rejects.toThrow();
    files.set(keys[1],second);
    const manyDescriptor = randomUUID()+".webm.parts-v1-100-2001";
    const manyKeys = partKeys(parseVideoParts(manyDescriptor)!);
    for (const key of manyKeys) files.set(key,Buffer.alloc(100));
    await cloudStorage(url,"test-service-key").remove([manyDescriptor]);
    expect(manyKeys.some(key => files.has(key))).toBe(false);
    await request(runtime.app).delete("/api/media/"+id).set(headers).set("Cookie",cookie).expect(204);
    expect(keys.some(key => files.has(key))).toBe(false);
    expect((await pg.query("SELECT * FROM rincon.media WHERE id=$1",[photo.body.id])).rows).toEqual(before);
    expect(files.has(photo.body.id+".png")).toBe(true);
  }, 60_000);
  it("reserves failed video parts and recovers only stale unconfirmed uploads", async () => {
    const cookie = await login();
    const original = readFileSync(new URL("./fixtures/recuerdo.mp4", import.meta.url));
    const video = Buffer.concat([original, Buffer.alloc(50_000_001-original.length)]);
    const id = randomUUID(); failPartAfter=1; failDelete=true;
    await request(runtime.app).post("/api/media").set(headers).set("Cookie",cookie).set("X-Upload-Id",id).attach("file",video,"large.mp4").expect(500);
    expect(files.size).toBe(1);
    const library = (await request(runtime.app).get("/api/library").set("Cookie",cookie)).body;
    expect(library.storage.reserved).toBe(video.length);
    const journal = (await pg.query<{value:string}>("SELECT value FROM rincon.meta WHERE key=$1",["video-upload:"+id])).rows[0];
    await runtime.close(); failDelete=false; runtime=await start();
    expect(files.size).toBe(1); // Another instance may still be uploading.
    await pg.query("UPDATE rincon.meta SET value=$1 WHERE key=$2",[JSON.stringify({...JSON.parse(journal.value),createdAt:new Date(Date.now()-2*3600000).toISOString()}),"video-upload:"+id]);
    await runtime.close(); runtime=await start();
    expect(files.size).toBe(0);
    expect((await pg.query("SELECT key FROM rincon.meta WHERE key LIKE 'video-upload:%'")).rows).toEqual([]);
    expect((await request(runtime.app).get("/api/library").set("Cookie",cookie)).body.storage.used).toBe(0);
    uploadedParts=0;failPartAfter=1;
    await request(runtime.app).post("/api/media").set(headers).set("Cookie",cookie).set("X-Upload-Id",id).attach("file",video,"large.mp4").expect(500);
    expect(files.size).toBe(0);
    expect((await pg.query("SELECT key FROM rincon.meta WHERE key LIKE 'video-upload:%'")).rows).toEqual([]);
    uploadedParts=0;failPartAfter=Infinity;
    loseInsertResponse=true;
    await request(runtime.app).post("/api/media").set(headers).set("Cookie",cookie).set("X-Upload-Id",id).attach("file",video,"large.mp4").expect(500);
    expect(files.size).toBe(6);
    await request(runtime.app).post("/api/media").set(headers).set("Cookie",cookie).set("X-Upload-Id",id).attach("file",original,"retry.mp4").expect(200);
    expect((await pg.query("SELECT id FROM rincon.media WHERE id=$1",[id])).rows).toHaveLength(1);
    await runtime.close();runtime=await start();
    expect(files.size).toBe(6);
    await request(runtime.app).delete("/api/media/"+id).set(headers).set("Cookie",cookie).expect(204);
    expect(files.size).toBe(0);
  },60_000);
  it("rejects oversized audio disguised as video without writing objects", async () => {
    const cookie=await login();
    const original=readFileSync(new URL("./fixtures/recuerdo.mp4",import.meta.url));
    const video=Buffer.concat([original,Buffer.alloc(50_000_001-original.length)]);
    await request(runtime.app).post("/api/media").set(headers).set("Cookie",cookie).attach("file",video,"song.m4a").expect(413);
    expect(files.size).toBe(0);
    expect((await pg.query("SELECT id FROM rincon.media")).rows).toEqual([]);
  },60_000);
  it("rejects videos that exceed remaining capacity before creating private objects",async()=>{
    await runtime.close(); runtime=await start(50_000_000);
    const cookie=await login();
    const original=readFileSync(new URL("./fixtures/recuerdo.mp4",import.meta.url));
    await request(runtime.app).post("/api/media").set(headers).set("Cookie",cookie).attach("file",Buffer.concat([original,Buffer.alloc(50_000_001-original.length)]),"large.mp4").expect(413);
    expect(files.size).toBe(0);
    expect((await pg.query("SELECT key FROM rincon.meta WHERE key LIKE 'video-upload:%'")).rows).toEqual([]);
  },60_000);
  it("persists private places in PostgreSQL across staging replacement without changing memories or objects", async () => {
    const cookie=await login();
    await upload(cookie).expect(201);
    const before=(await pg.query("SELECT * FROM rincon.media ORDER BY id")).rows;
    const objects=new Map(files);
    const body={name:"Café demo",address:"Buenos Aires",category:"cafe",note:"Sintético",lat:-34.6,lng:-58.4};
    const place=(await request(runtime.app).post("/api/places").set(headers).set("Cookie",cookie).send(body).expect(201)).body;
    await runtime.close();runtime=await start();
    const library=(await request(runtime.app).get("/api/library").set("Cookie",cookie).expect(200)).body;
    expect(library.places).toContainEqual(place);
    await request(runtime.app).patch("/api/places/"+place.id).set(headers).set("Cookie",cookie).send({...body,category:"visit"}).expect(200);
    await request(runtime.app).delete("/api/places/"+place.id).set(headers).set("Cookie",cookie).expect(204);
    expect((await pg.query("SELECT * FROM rincon.media ORDER BY id")).rows).toEqual(before);
    expect(files).toEqual(objects);
    expect((await pg.query("SELECT key FROM rincon.meta WHERE key LIKE 'place:%'")).rows).toEqual([]);
  });
  it("stores album titles and covers in PostgreSQL without rewriting remote memories or objects", async () => {
    const cookie = await login();
    const photo = await upload(cookie).field("album", "Viajes").expect(201);
    const rowsBefore = (await pg.query("SELECT * FROM rincon.media ORDER BY id")).rows;
    const originalsBefore = new Map(files);
    const body = { album: "Viajes", title: "Nuestro viaje", coverId: photo.body.id };
    await request(runtime.app).patch("/api/albums").set(headers).set("Cookie", cookie).send(body).expect(200);
    expect((await pg.query("SELECT * FROM rincon.media ORDER BY id")).rows).toEqual(rowsBefore);
    expect(files).toEqual(originalsBefore);
    await runtime.close();
    runtime = await start();
    const library = await request(runtime.app).get("/api/library").set("Cookie", cookie).expect(200);
    expect(library.body.albums).toContainEqual(body);
    expect(library.body.media[0].album).toBe("Viajes");
  });
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
