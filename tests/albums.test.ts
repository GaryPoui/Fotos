import { expect, it } from "vitest";
import request from "supertest";
import sharp from "sharp";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "../server/app.js";
import { albumCover } from "../shared/albums.js";
import type { Media } from "../shared/types.js";

it("personalizes albums privately without changing media, persists, and resolves new uploads to the same group", async () => {
  const directory = mkdtempSync(join(tmpdir(), "rincon-albums-"));
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
    const upload = async (album: string) =>
      (
        await agent
          .post("/api/media")
          .set(headers)
          .field("title", "Nuestro recuerdo")
          .field("date", "2021-02-14")
          .field("album", album)
          .attach("file", original, "cielo.png")
          .expect(201)
      ).body;
    const first = await upload("Viajes");
    const other = await upload("Salidas");
    const rowsBefore = await runtime.db
      .prepare("SELECT * FROM media ORDER BY id")
      .all();
    const body = {
      album: "Viajes",
      title: "Nuestros viajes",
      coverId: first.id,
    };
    await request(runtime.app)
      .patch("/api/albums")
      .set(headers)
      .send(body)
      .expect(401);
    await agent.patch("/api/albums").send(body).expect(403);
    await agent
      .patch("/api/albums")
      .set(headers)
      .send({ ...body, coverId: other.id })
      .expect(400);
    await agent
      .patch("/api/albums")
      .set(headers)
      .send({ ...body, title: " " })
      .expect(400);
    await agent
      .patch("/api/albums")
      .set(headers)
      .send({ ...body, title: "a".repeat(81) })
      .expect(400);
    await agent
      .patch("/api/albums")
      .set(headers)
      .send({ ...body, title: "salidas" })
      .expect(409);
    await agent
      .patch("/api/albums")
      .set(headers)
      .send({ ...body, album: "No existe" })
      .expect(404);
    await agent.patch("/api/albums").set(headers).send(body).expect(200);
    expect(
      await runtime.db.prepare("SELECT * FROM media ORDER BY id").all(),
    ).toEqual(rowsBefore);
    expect(
      (await agent.get("/api/files/" + first.id).expect(200)).body,
    ).toEqual(original);
    runtime.close();
    runtime = await createApp({ dataDir: directory, password });
    // Use a fresh agent after restart.
    const reopened = request.agent(runtime.app);
    await reopened
      .post("/api/login")
      .set(headers)
      .send({ password })
      .expect(200);
    expect(
      (await reopened.get("/api/library").expect(200)).body.albums,
    ).toContainEqual(body);
    const added = await reopened
      .post("/api/media")
      .set(headers)
      .field("album", "Nuestros viajes")
      .attach("file", original, "nuevo.png")
      .expect(201);
    expect(added.body.album).toBe("Viajes");
    await reopened
      .patch("/api/media/" + other.id)
      .set(headers)
      .send({ album: "Nuestros viajes" })
      .expect(200);
    expect(
      (await reopened.get("/api/library")).body.media.filter(
        (item: { album: string }) => item.album === "Viajes",
      ),
    ).toHaveLength(3);
    await reopened
      .patch("/api/albums")
      .set(headers)
      .send({ ...body, coverId: null })
      .expect(200);
    expect((await reopened.get("/api/library")).body.albums).toContainEqual({
      ...body,
      coverId: null,
    });
  } finally {
    runtime.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
it("falls back to a current album photo when its chosen cover moves or disappears", () => {
  const first = { id: "first", album: "Viajes", kind: "photo" } as Media;
  const second = { id: "second", album: "Viajes", kind: "photo" } as Media;
  const preferences = [
    { album: "Viajes", title: "Nuestros viajes", coverId: second.id },
  ];
  expect(albumCover("Viajes", [first, second], preferences)).toBe(second);
  expect(albumCover("Viajes", [first], preferences)).toBe(first);
  expect(
    albumCover("Viajes", [first, { ...second, album: "Salidas" }], preferences),
  ).toBe(first);
  expect(
    albumCover("Viajes", [{ ...first, kind: "video" }], preferences),
  ).toBeUndefined();
});
