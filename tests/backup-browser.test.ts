import { it, expect } from "vitest";
import { unzipSync, strFromU8 } from "fflate";
import { backupZip, backupParts } from "../src/backup";
import type { Library, Media } from "../shared/types";
const media = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Momento",
  kind: "photo",
  size: 3,
  mime: "image/png",
  date: "2020-01-01",
  album: "Viaje",
  tags: [],
  favorite: false,
  artist: "",
  createdAt: "",
} as Media;
const library: Library = {
  places: [{id:"33333333-3333-4333-8333-333333333333",name:"Lugar demo",address:"Buenos Aires",category:"important",note:"Una primera salida",lat:-34.6,lng:-58.4,createdAt:"2026-10-10T12:00:00Z",updatedAt:"2026-10-10T12:00:00Z"}],
  albums: [{ album: "Viaje", title: "Nuestros viajes", coverId: media.id }],
  media: [media],
  notes: [
    {
      id: "22222222-2222-4222-8222-222222222222",
      type: "letter",
      title: "Carta",
      body: "Te quiero\nsiempre",
      author: "Nosotros",
      date: "2020-01-01",
      favorite: false,
      createdAt: "",
    },
  ],
  settings: { names: "Nosotros", title: "Rincón", since: "" },
  storage: { used: 3, limit: 900000000, maxFile: 50000000 },
};
it("exports readable private originals, thumbnails, letters and verifiable hashes", async () => {
  const calls: string[] = [];
  const read = (async (path: string) => {
    calls.push(path);
    return new Response(new Uint8Array([1, 2, 3]));
  }) as typeof fetch;
  const zip = await backupZip(
    library,
    [media],
    1,
    1,
    () => {},
    undefined,
    read,
  );
  const files = unzipSync(zip);
  const manifest = JSON.parse(strFromU8(files["recuerdos.json"]));
  expect(calls).toEqual([
    "/api/files/" + media.id,
    "/api/files/" + media.id + "?thumb=1",
  ]);
  expect(manifest.settings).toEqual(library.settings);
  expect(manifest.albums).toEqual(library.albums);
  expect(manifest.places).toEqual(library.places);
  expect(manifest.files).toHaveLength(3);
  for (const item of manifest.files) {
    const hash = Buffer.from(
      await crypto.subtle.digest("SHA-256", files[item.path]),
    ).toString("hex");
    expect(hash).toBe(item.sha256);
  }
  expect(strFromU8(files["cartas/" + library.notes[0].id + ".txt"])).toContain(
    "Te quiero\nsiempre",
  );
});
it("splits storage into bounded parts and rejects incomplete/denied downloads", async () => {
  expect(
    backupParts([
      { ...media, size: 60_000_000 },
      { ...media, size: 60_000_000 },
    ]),
  ).toHaveLength(2);
  expect(backupParts([])).toEqual([[]]);
  for (const response of [
    new Response("", { status: 401 }),
    new Response("ab"),
  ])
    await expect(
      backupZip(
        library,
        [media],
        1,
        1,
        () => {},
        undefined,
        (async () => response) as typeof fetch,
      ),
    ).rejects.toThrow();
});
