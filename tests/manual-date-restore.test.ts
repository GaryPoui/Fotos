import { expect, it } from "vitest";
import request from "supertest";
import sharp from "sharp";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDb } from "../server/db.js";
import { createApp } from "../server/app.js";

it("preserves previous automatic uploads and allows their dates to be edited manually", async () => {
  const directory = mkdtempSync(join(tmpdir(), "rincon-manual-date-"));
  const password = "test-only-password-2026";
  const headers = { "X-Requested-With": "NuestroRincon" };
  let runtime = await createApp({ dataDir: directory, password });
  try {
    const agent = request.agent(runtime.app);
    await agent.post("/api/login").set(headers).send({ password }).expect(200);
    const original = await sharp({
      create: { width: 16, height: 16, channels: 3, background: "#d6ebf7" },
    })
      .png()
      .toBuffer();
    const uploaded = await agent
      .post("/api/media")
      .set(headers)
      .field("date", "2021-02-14")
      .field("title", "Título guardado")
      .field("album", "Nuestro álbum")
      .attach("file", original, "cielo.png")
      .expect(201);
    runtime.close();
    const db = openDb(directory);
    const capture = JSON.stringify({
      capturedAt: "2021-02-14T23:58:07",
      captureOffset: "-03:00",
      dateSource: "metadata",
    });
    const key = "capture:" + uploaded.body.id;
    db.prepare("INSERT INTO meta (key,value) VALUES (?,?)").run(key, capture);
    const before = db
      .prepare("SELECT * FROM media WHERE id=?")
      .get(uploaded.body.id);
    db.close();
    runtime = await createApp({ dataDir: directory, password });
    const restarted = request.agent(runtime.app);
    await restarted
      .post("/api/login")
      .set(headers)
      .send({ password })
      .expect(200);
    const library = await restarted.get("/api/library").expect(200);
    expect(library.body.media[0]).toMatchObject({
      id: uploaded.body.id,
      title: "Título guardado",
      date: "2021-02-14",
      album: "Nuestro álbum",
    });
    const inspection = openDb(directory);
    expect(
      inspection
        .prepare("SELECT * FROM media WHERE id=?")
        .get(uploaded.body.id),
    ).toEqual(before);
    inspection.close();
    const edited = await restarted
      .patch("/api/media/" + uploaded.body.id)
      .set(headers)
      .send({ date: "2020-12-31" })
      .expect(200);
    expect(edited.body).toMatchObject({
      date: "2020-12-31",
      title: "Título guardado",
      album: "Nuestro álbum",
    });
    expect(
      (await restarted.get("/api/files/" + uploaded.body.id).expect(200)).body,
    ).toEqual(original);
    const final = openDb(directory);
    expect(
      final.prepare("SELECT value FROM meta WHERE key=?").get(key),
    ).toEqual({ value: capture });
    final.close();
  } finally {
    runtime.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
