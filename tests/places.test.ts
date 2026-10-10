import { it, expect, vi } from "vitest";
import request from "supertest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "../server/app.js";
import { createPlaceResolver, parseMapsUrl } from "../server/places.js";

it("parses Maps points before camera centers and rejects unsafe links and routes", () => {
  expect(
    parseMapsUrl("https://www.google.com/maps/search/?api=1&query=-34.6,-58.4")
      .point,
  ).toMatchObject({ lat: -34.6, lng: -58.4 });
  expect(
    parseMapsUrl(
      "https://www.google.com/maps/place/Cafe/@-34,-58,15z/data=!4m2!3d-34.61!4d-58.42",
    ).point,
  ).toMatchObject({ lat: -34.61, lng: -58.42 });
  expect(
    parseMapsUrl("https://www.google.com/maps/place/Cafe/@-34,-58,15z"),
  ).toMatchObject({ query: "Cafe" });
  expect(
    parseMapsUrl("https://maps.google.com/?q=Obelisco+Buenos+Aires"),
  ).toMatchObject({ query: "Obelisco Buenos Aires" });
  expect(
    parseMapsUrl("https://www.google.com/maps/@-34,-58,15z").point,
  ).toMatchObject({ lat: -34, lng: -58, approximate: true });
  for (const url of [
    "http://maps.app.goo.gl/foo",
    "https://www.google.com.evil.test/maps/",
    "https://google.com:444/maps/",
    "https://user:pass@google.com/maps/",
    "https://127.0.0.1/maps/",
    "https://www.google.com/maps/dir/A/B",
    "https://goo.gl/notmaps/foo",
    "https://www.google.com/maps/search/?query=95,200",
  ])
    expect(() => parseMapsUrl(url)).toThrow();
});

it("resolves short redirects only to allowed Maps destinations and never scrapes HTML", async () => {
  const fetcher = vi.fn(
    async () =>
      new Response(null, {
        status: 302,
        headers: {
          Location:
            "https://www.google.com/maps/search/?api=1&query=-34.6,-58.4",
        },
      }),
  );
  const resolve = createPlaceResolver({ fetcher: fetcher as typeof fetch });
  expect(await resolve("https://maps.app.goo.gl/example")).toMatchObject([
    { lat: -34.6, lng: -58.4 },
  ]);
  expect(fetcher).toHaveBeenCalledTimes(2); // Redirect, then address lookup; never Maps HTML.
  expect(fetcher.mock.calls[0]).toBeDefined();
  const unsafe = vi.fn(
    async () =>
      new Response(null, {
        status: 302,
        headers: { Location: "http://169.254.169.254/latest/meta-data" },
      }),
  );
  await expect(
    createPlaceResolver({ fetcher: unsafe as typeof fetch })(
      "https://maps.app.goo.gl/example",
    ),
  ).rejects.toThrow();
  expect(unsafe).toHaveBeenCalledTimes(1);
  const loop = vi.fn(
    async () =>
      new Response(null, {
        status: 302,
        headers: { Location: "https://maps.app.goo.gl/loop" },
      }),
  );
  await expect(
    createPlaceResolver({ fetcher: loop as typeof fetch })(
      "https://maps.app.goo.gl/example",
    ),
  ).rejects.toThrow();
  expect(loop.mock.calls.length).toBeLessThanOrEqual(5);
});

it("searches Photon GeoJSON explicitly with bounded cache, throttles and handles failure", async () => {
  let now = 10000;
  const fetcher = vi.fn(async () =>
    Response.json({
      features: [
        {
          geometry: { coordinates: [-58.4, -34.6] },
          properties: {
            name: "Café",
            street: "Corrientes",
            housenumber: "100",
            city: "Buenos Aires",
          },
        },
        {
          geometry: { coordinates: [900, 900] },
          properties: { name: "Invalid" },
        },
      ],
    }),
  );
  const resolve = createPlaceResolver({
    fetcher: fetcher as typeof fetch,
    now: () => now,
  });
  expect(await resolve("Corrientes 100 Buenos Aires")).toMatchObject([
    {
      name: "Café",
      address: expect.stringContaining("Corrientes"),
      lat: -34.6,
      lng: -58.4,
    },
  ]);
  await resolve("Corrientes 100 Buenos Aires");
  expect(fetcher).toHaveBeenCalledTimes(1);
  await expect(resolve("Otro lugar público")).rejects.toMatchObject({
    status: 429,
  });
  now += 1100;
  await resolve("Otro lugar público");
  expect(fetcher).toHaveBeenCalledTimes(2);
  await expect(
    createPlaceResolver({
      fetcher: (async () =>
        new Response("failure", { status: 503 })) as typeof fetch,
    })("Obelisco Buenos Aires"),
  ).rejects.toMatchObject({ status: 502 });
  expect(
    await createPlaceResolver({
      fetcher: (async () => Response.json({ features: [] })) as typeof fetch,
    })("Lugar inexistente"),
  ).toEqual([]);
});

it("enriches Maps points with a nearby address without moving the original point or losing it on failure", async () => {
  const link =
    "https://www.google.com/maps/place/Nuestro+Cafe/@-34,-58,15z/data=!3d-34.6!4d-58.4";
  const fetcher = vi.fn(async (_url: RequestInfo | URL) =>
    Response.json({
      features: [
        {
          geometry: { coordinates: [-58.40005, -34.60005] },
          properties: {
            name: "Otra etiqueta",
            street: "Corrientes",
            housenumber: "100",
            city: "Buenos Aires",
          },
        },
        {
          geometry: { coordinates: [-58.5, -34.7] },
          properties: { street: "Lejana", housenumber: "999" },
        },
      ],
    }),
  );
  const resolve = createPlaceResolver({ fetcher: fetcher as typeof fetch });
  expect(await resolve(link)).toEqual([
    {
      name: "Nuestro Cafe",
      address: "Corrientes 100, Buenos Aires",
      lat: -34.6,
      lng: -58.4,
      addressApproximate: true,
    },
  ]);
  const url = new URL(fetcher.mock.calls[0]![0] as unknown as string);
  expect(url.pathname).toBe("/reverse");
  expect(url.searchParams.get("lat")).toBe("-34.6");
  expect(url.searchParams.get("lon")).toBe("-58.4");
  expect(url.searchParams.get("radius")).toBe("0.1");
  await resolve(link);
  expect(fetcher).toHaveBeenCalledTimes(1);
  await expect(
    resolve(link.replace("-34.6!", "-34.61!")),
  ).rejects.toMatchObject({ status: 429 });
  const failed = createPlaceResolver({
    fetcher: (async () => {
      throw new Error("Offline");
    }) as typeof fetch,
  });
  expect(await failed(link)).toEqual([
    { name: "Nuestro Cafe", address: "", lat: -34.6, lng: -58.4 },
  ]);
  const distant = createPlaceResolver({
    fetcher: (async () =>
      Response.json({
        features: [
          {
            geometry: { coordinates: [-58.5, -34.7] },
            properties: { street: "Lejana" },
          },
        ],
      })) as typeof fetch,
  });
  expect((await distant(link))[0].address).toBe("");
});

it("stores places privately across restart without rewriting historical content", async () => {
  const directory = mkdtempSync(join(tmpdir(), "rincon-places-"));
  const password = "test-only-password-places";
  const headers = { "X-Requested-With": "NuestroRincon" };
  const lookup = vi.fn(async () => [
    { name: "Plaza", address: "Buenos Aires", lat: -34.6, lng: -58.4 },
  ]);
  let runtime = await createApp({
    dataDir: directory,
    password,
    placeResolver: lookup,
  });
  const body = {
    name: "Nuestro café",
    address: "Corrientes100",
    category: "cafe",
    note: "Una tarde juntos",
    lat: -34.6,
    lng: -58.4,
  };
  try {
    const agent = request.agent(runtime.app);
    await request(runtime.app)
      .post("/api/places")
      .set(headers)
      .send(body)
      .expect(401);
    await request(runtime.app)
      .post("/api/places/resolve")
      .set(headers)
      .send({ query: "Plaza" })
      .expect(401);
    expect(lookup).not.toHaveBeenCalled();
    await agent.post("/api/login").set(headers).send({ password }).expect(200);
    await agent
      .post("/api/notes")
      .set(headers)
      .send({
        type: "letter",
        title: "Carta demo",
        body: "No cambiar",
        date: "2021-02-14",
      })
      .expect(201);
    await runtime.db
      .prepare("INSERT INTO meta VALUES (?,?)")
      .run(
        "album:Demo",
        JSON.stringify({ album: "Demo", title: "Un álbum", coverId: null }),
      );
    const before = await runtime.db
      .prepare("SELECT * FROM meta ORDER BY key")
      .all();
    const notes = await runtime.db
      .prepare("SELECT * FROM notes ORDER BY id")
      .all();
    await agent.post("/api/places").send(body).expect(403);
    for (const invalid of [
      { ...body, lat: 91 },
      { ...body, lng: 181 },
      { ...body, name: " " },
      { ...body, category: "unknown" },
      { ...body, note: "x".repeat(1001) },
      { ...body, id: "salt" },
    ])
      await agent.post("/api/places").set(headers).send(invalid).expect(400);
    const saved = (
      await agent.post("/api/places").set(headers).send(body).expect(201)
    ).body;
    expect(saved).toMatchObject(body);
    await agent.patch("/api/places/salt").set(headers).send(body).expect(400);
    await agent.delete("/api/places/salt").set(headers).expect(400);
    await agent
      .patch("/api/places/" + saved.id)
      .set(headers)
      .send({ ...body, name: "Nuestro restaurante", category: "restaurant" })
      .expect(200);
    await agent
      .post("/api/places/resolve")
      .set(headers)
      .send({ query: "Plaza" })
      .expect(200);
    runtime.close();
    runtime = await createApp({
      dataDir: directory,
      password,
      placeResolver: lookup,
    });
    const reopened = request.agent(runtime.app);
    await reopened
      .post("/api/login")
      .set(headers)
      .send({ password })
      .expect(200);
    const library = (await reopened.get("/api/library").expect(200)).body;
    expect(library.places).toMatchObject([
      {
        id: saved.id,
        name: "Nuestro restaurante",
        category: "restaurant",
        createdAt: saved.createdAt,
      },
    ]);
    await reopened
      .delete("/api/places/" + saved.id)
      .set(headers)
      .expect(204);
    await reopened
      .delete("/api/places/" + saved.id)
      .set(headers)
      .expect(404);
    expect(
      await runtime.db.prepare("SELECT * FROM meta ORDER BY key").all(),
    ).toEqual(before);
    expect(
      await runtime.db.prepare("SELECT * FROM notes ORDER BY id").all(),
    ).toEqual(notes);
  } finally {
    await runtime.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
