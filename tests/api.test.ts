import { afterEach, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { mkdtempSync, rmSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "../server/app.js";
import sharp from "sharp";

const password = "test-only-password-2026";
const mutation = { "X-Requested-With": "NuestroRincon" };
const png = await sharp({
  create: { width: 16, height: 16, channels: 3, background: "#d6ebf7" },
})
  .png()
  .toBuffer();
let dir: string;
let runtime: Awaited<ReturnType<typeof createApp>>;
let agent: ReturnType<typeof request.agent>;
beforeEach(async () => {
  dir = mkdtempSync(join(tmpdir(), "rincon-test-"));
  runtime = await createApp({
    dataDir: dir,
    password,
    maxFileBytes: 1024 * 1024,
  });
  agent = request.agent(runtime.app);
});
afterEach(() => {
  runtime.close();
  rmSync(dir, { recursive: true, force: true });
});
async function login() {
  return agent.post("/api/login").set(mutation).send({ password }).expect(200);
}

describe("Private space", () => {
  it("protects content and files, creates a session and revokes it on logout", async () => {
    await agent.get("/api/library").expect(401);
    await agent.get("/api/files/nonexistent").expect(401);
    await agent
      .post("/api/login")
      .set(mutation)
      .send({ password: "incorrect" })
      .expect(401);
    const response = await login();
    expect(response.headers["set-cookie"][0]).toContain("HttpOnly");
    await agent.get("/api/library").expect(200);
    await agent.post("/api/logout").set(mutation).expect(204);
    await agent.get("/api/library").expect(401);
  });
  it("blocks cross-origin mutations and missing request header", async () => {
    await agent.post("/api/login").send({ password }).expect(403);
    await agent
      .post("/api/login")
      .set(mutation)
      .set("Origin", "https://evil.example")
      .send({ password })
      .expect(403);
  });
  it("limits failed password attempts", async () => {
    for (let i = 0; i < 8; i++)
      await agent
        .post("/api/login")
        .set(mutation)
        .send({ password: "wrong" })
        .expect(401);
    await agent.post("/api/login").set(mutation).send({ password }).expect(429);
  });
});

describe("Persistent memories", () => {
  it("keeps the manual day and extracts camera seconds without changing originals or accepting a conflicting hint",async()=>{
    await login();
    const jpeg=await sharp(png).jpeg().withExif({IFD2:{DateTimeOriginal:"2025:04:03 19:02:09",OffsetTimeOriginal:"+09:00"}}).toBuffer();
    const response=await agent.post("/api/media").set(mutation).field("date","2012-02-14").field("capturedAt","2000-01-01T01:00:00").attach("file",jpeg,"clock.jpg").expect(201);
    expect(response.body.date).toBe("2012-02-14");expect(response.body.capturedAt).toBe("2025-04-03T19:02:09");
    const original=await agent.get("/api/files/"+response.body.id).expect(200);expect(original.body).toEqual(jpeg);
    await agent.patch("/api/media/"+response.body.id).set(mutation).send({capturedAt:"2000-01-01T00:00:00"}).expect(400);
    const patched=await agent.patch("/api/media/"+response.body.id).set(mutation).send({date:"2011-01-01"}).expect(200);
    expect(patched.body.date).toBe("2011-01-01");expect(patched.body.capturedAt).toBe("2025-04-03T19:02:09");
    await agent.delete("/api/media/"+response.body.id).set(mutation).expect(204);
    expect(await runtime.db.prepare("SELECT key FROM meta WHERE key LIKE 'photo-clock:%'").all()).toEqual([]);
  });
  it("does not invent missing seconds or reinterpret capture records from the withdrawn feature",async()=>{
    await login();
    const uploaded=await agent.post("/api/media").set(mutation).field("date","2001-01-01").field("capturedAt","2025-04-03T19:02").attach("file",png,"no-exif.png").expect(201);
    await runtime.db.prepare("INSERT INTO meta (key,value) VALUES (?,?)").run("capture:"+uploaded.body.id,JSON.stringify({capturedAt:"2020-01-01T20:00:00"}));
    const library=(await agent.get("/api/library").expect(200)).body;
    expect(library.media[0].capturedAt).toBeUndefined();expect(library.media[0].date).toBe("2001-01-01");
  });
  it("uploads, edits, streams privately with ranges and deletes a photo", async () => {
    await login();
    const created = await agent
      .post("/api/media")
      .set(mutation)
      .field("title", "Nuestro día")
      .field("date", "2026-02-14")
      .field("album", "Viajes")
      .field("tags", '["mar"]')
      .attach("file", png, "recuerdo.png")
      .expect(201);
    const id = created.body.id;
    expect(created.body.kind).toBe("photo");
    await request(runtime.app)
      .get("/api/files/" + id)
      .expect(401);
    await agent
      .get("/api/files/" + id)
      .set("Range", "bytes=0-9")
      .expect(206);
    await agent
      .patch("/api/media/" + id)
      .set(mutation)
      .send({ favorite: true, title: "Con vos" })
      .expect(200);
    const library = await agent.get("/api/library").expect(200);
    expect(library.body.media[0]).toMatchObject({
      title: "Con vos",
      favorite: true,
      tags: ["mar"],
    });
    await agent
      .delete("/api/media/" + id)
      .set(mutation)
      .expect(204);
    await agent.get("/api/files/" + id).expect(404);
  });
  it("rejects disguised HTML, malformed dates and oversized files without leftovers", async () => {
    await login();
    await agent
      .post("/api/media")
      .set(mutation)
      .attach("file", Buffer.from("<script>alert(1)</script>"), "evil.jpg")
      .expect(400);
    await agent
      .post("/api/media")
      .set(mutation)
      .field("date", "2026-02-30")
      .attach("file", png, "photo.png")
      .expect(400);
    await agent
      .post("/api/media")
      .set(mutation)
      .attach("file", Buffer.alloc(1024 * 1024 + 1), "huge.png")
      .expect(413);
    expect(readdirSync(join(dir, "tmp"))).toEqual([]);
    expect(readdirSync(join(dir, "media"))).toEqual([]);
  });
  it("persists notes and sessions across a restart, invalidates after password change", async () => {
    await login();
    const note = await agent
      .post("/api/notes")
      .set(mutation)
      .send({
        type: "letter",
        title: "Para vos",
        body: "Te quiero\nSiempre",
        author: "Yo",
        date: "2026-10-07",
      })
      .expect(201);
    const cookie = (
      await agent.post("/api/login").set(mutation).send({ password })
    ).headers["set-cookie"][0].split(";")[0];
    runtime.close();
    runtime = await createApp({ dataDir: dir, password });
    const persisted = await request(runtime.app)
      .get("/api/library")
      .set("Cookie", cookie)
      .expect(200);
    expect(persisted.body.notes[0].body).toBe("Te quiero\nSiempre");
    await request(runtime.app)
      .patch("/api/notes/" + note.body.id)
      .set("Cookie", cookie)
      .set(mutation)
      .send({ favorite: true })
      .expect(200);
    runtime.close();
    runtime = await createApp({
      dataDir: dir,
      password: "another-strong-password",
    });
    await request(runtime.app)
      .get("/api/library")
      .set("Cookie", cookie)
      .expect(401);
  });
  it("validates notes and settings and allows deletion", async () => {
    await login();
    await agent
      .post("/api/notes")
      .set(mutation)
      .send({ type: "quote", body: "  " })
      .expect(400);
    const note = await agent
      .post("/api/notes")
      .set(mutation)
      .send({
        type: "quote",
        title: "Nosotros",
        body: "<b>Siempre</b>",
        author: "Yo",
        date: "2026-10-07",
      })
      .expect(201);
    await agent
      .patch("/api/settings")
      .set(mutation)
      .send({
        names: "Tomy y su amor",
        title: "Nuestro rincón",
        since: "2025-01-01",
      })
      .expect(200);
    await agent
      .delete("/api/notes/" + note.body.id)
      .set(mutation)
      .expect(204);
    expect((await agent.get("/api/library")).body.notes).toEqual([]);
  });
});
