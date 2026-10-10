import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
const png = readFileSync(new URL("./fixtures/cielo.png", import.meta.url));
const headers = { "X-Requested-With": "NuestroRincon" };
async function login(page: Page) {
  await page.goto("/");
  await page
    .getByLabel("Nuestra contraseña")
    .fill("browser-test-password-2026");
  await page.getByRole("button", { name: "Entrar a nuestro rincón" }).click();
  await expect(
    page.getByRole("heading", { name: /Nuestros momentos/ }),
  ).toBeVisible();
}
async function assertFits(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const small = await page.locator("button:visible").evaluateAll((buttons) =>
    buttons
      .filter((button) => {
        const rect = button.getBoundingClientRect();
        return rect.width < 43.9 || rect.height < 43.9;
      })
      .map((button) => button.getAttribute("aria-label") || button.textContent),
  );
  expect(small, "Controles de al menos 44 × 44 px").toEqual([]);
}
async function uploadPhoto(page: Page, title: string) {
  await page
    .getByRole("button", { name: "Subir recuerdos", exact: true })
    .click();
  await page
    .getByLabel("Fotos y videos", { exact: true })
    .setInputFiles({ name: "cielo.png", mimeType: "image/png", buffer: png });
  await page.getByLabel("Título", { exact: true }).fill(title);
  await page.getByLabel("Álbum", { exact: true }).fill("Nuestros viajes");
  await page.getByLabel("Etiquetas", { exact: true }).fill("cielo, juntos");
  await page.getByRole("button", { name: "Guardar en nuestro rincón" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}
test("gallery: upload, edit, favorite, filter, carousel, reduced motion, delete and logout", async ({
  page,
}, info) => {
  const title = "Recuerdo " + info.project.name;
  await login(page);
  await assertFits(page);
  if (info.project.name === "mobile") {
    await page.setViewportSize({ width: 360, height: 780 });
    await assertFits(page);
    await page.setViewportSize({ width: 390, height: 844 });
  }
  await page.screenshot({
    path: "test-results/" + info.project.name + "-empty.png",
    fullPage: true,
  });
  await uploadPhoto(page, title);
  await uploadPhoto(page, "Segundo " + info.project.name);
  await page.getByLabel("Buscar recuerdos").fill(title);
  await expect(
    page.getByRole("button", { name: "Abrir " + title, exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Marcar favorito: " + title, exact: true })
    .click();
  await page
    .getByRole("button", { name: "Abrir " + title, exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Editar recuerdo" }).click();
  await page.getByLabel("Título", { exact: true }).fill(title + " editado");
  await page.getByRole("button", { name: "Guardar detalles" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: /Nuestros momentos/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Mostrar filtros" }).click();
  await page
    .getByRole("combobox", { name: "Álbum", exact: true })
    .selectOption("Nuestros viajes");
  await page
    .getByRole("button", { name: "Línea de tiempo", exact: true })
    .click();
  await expect(page.locator(".month-label").first()).toBeVisible();
  await page.getByRole("button", { name: "Carrusel", exact: true }).click();
  await page.getByRole("button", { name: "Recuerdo siguiente" }).click();
  await page.getByRole("button", { name: "Presentación", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Pausar", exact: true }),
  ).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(
    page.getByRole("button", { name: "Presentación", exact: true }),
  ).toBeDisabled();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.getByRole("button", { name: "Mosaico", exact: true }).click();
  await page.getByLabel("Buscar recuerdos").fill(title + " editado");
  await page
    .getByRole("button", { name: "Abrir " + title + " editado", exact: true })
    .click();
  await page.getByRole("button", { name: "Eliminar recuerdo" }).click();
  await page.getByRole("button", { name: "Conservar", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: "Abrir " + title + " editado",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Abrir " + title + " editado", exact: true })
    .click();
  await page.getByRole("button", { name: "Eliminar recuerdo" }).click();
  await page.getByRole("button", { name: "Eliminar", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await assertFits(page);
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page.getByLabel("Nuestra contraseña")).toBeVisible();
});
test("letters and settings persist and render text safely", async ({
  page,
}, info) => {
  await login(page);
  await page.getByRole("button", { name: "Palabras", exact: true }).click();
  await page.getByRole("button", { name: "Escribir", exact: true }).click();
  await page
    .getByLabel("Título", { exact: true })
    .fill("Para vos " + info.project.name);
  await page
    .getByLabel("Tu carta", { exact: true })
    .fill("Te quiero.\n<script>window.injected=true</script>\nSiempre.");
  await page.getByLabel("De parte de").fill("Yo");
  await page.getByRole("button", { name: "Guardar estas palabras" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("button", {
      name: new RegExp("^Para vos " + info.project.name + " "),
    })
    .click();
  await expect(page.locator(".note-reader")).toContainText(
    "<script>window.injected=true</script>",
  );
  expect(
    await page.evaluate(
      () => (window as unknown as { injected?: boolean }).injected,
    ),
  ).toBeUndefined();
  await page.getByRole("button", { name: "Cerrar", exact: true }).click();
  await page
    .getByRole("button", { name: "Personalizar nuestro rincón" })
    .click();
  await page.getByLabel("Nuestros nombres").fill("Cielo y amor");
  await page.getByLabel("Nombre del espacio").fill("Nuestro cielo");
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.reload();
  await expect(page.locator(".brand")).toContainText("Nuestro cielo");
  await page.getByRole("button", { name: "Palabras", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Para vos " + info.project.name,
      exact: true,
    }),
  ).toBeVisible();
  await assertFits(page);
  await page.screenshot({
    path: "test-results/" + info.project.name + "-letters.png",
    fullPage: true,
  });
});
test("new audio upload stays paused until requested and persists when navigating", async ({
  page,
}, info) => {
  await login(page);
  const samples = 44100 * 12;
  const wav = Buffer.alloc(44 + samples * 2);
  wav.write("RIFF");
  wav.writeUInt32LE(36 + samples * 2, 4);
  wav.write("WAVE", 8);
  wav.write("fmt ", 12);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(44100, 24);
  wav.writeUInt32LE(88200, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(samples * 2, 40);
  for (let i = 0; i < samples; i++)
    wav.writeInt16LE(
      Math.round(Math.sin((i / 44100) * 2 * Math.PI * 220) * 1000),
      44 + i * 2,
    );
  const title = "Canción " + info.project.name;
  await page.getByRole("button", { name: "Música", exact: true }).click();
  await page
    .getByRole("button", { name: "Subir canción", exact: true })
    .click();
  await page
    .getByLabel("Archivos de música")
    .setInputFiles({ name: "song.wav", mimeType: "audio/wav", buffer: wav });
  await page.getByLabel("Título", { exact: true }).fill(title);
  await page.getByLabel("Artista", { exact: true }).fill("Nosotros");
  await page.getByRole("button", { name: "Guardar en nuestro rincón" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    await page.locator("audio").evaluate((a: HTMLAudioElement) => a.paused),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Reproducir " + title, exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Pausar música" }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.locator("audio").evaluate((a: HTMLAudioElement) => a.currentTime),
    )
    .toBeGreaterThan(0);
  await page.getByRole("button", { name: "Palabras", exact: true }).click();
  await expect(
    page.getByRole("complementary", { name: "Reproductor de música" }),
  ).toBeVisible();
  expect(
    await page.locator("audio").evaluate((a: HTMLAudioElement) => a.paused),
  ).toBe(false);
  await page.getByRole("button", { name: "Pausar música" }).click();
  await expect(
    page.getByRole("button", { name: "Reproducir música" }),
  ).toBeVisible();
  await assertFits(page);
  await page.screenshot({
    path: "test-results/" + info.project.name + "-player.png",
    fullPage: true,
  });
  const response = await page.request.get("/api/library");
  const library = await response.json();
  const track = library.media.find((m: { title: string }) => m.title === title);
  await page.request.delete("/api/media/" + track.id, { headers });
});
test("video uploads privately and opens paused with working playback", async ({
  page,
}, info) => {
  await login(page);
  const recording = await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext("2d")!;
    const stream = canvas.captureStream(10);
    const recorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp8",
    });
    const chunks: Blob[] = [];
    const done = new Promise<Blob>((resolve) => {
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
    });
    recorder.start();
    let frame = 0;
    const timer = setInterval(() => {
      ctx.fillStyle = "#dceef9";
      ctx.fillRect(0, 0, 320, 240);
      ctx.fillStyle = "#edbfd1";
      ctx.beginPath();
      ctx.arc(140 + Math.sin(frame++ / 3) * 35, 110, 45, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#294253";
      ctx.font = "18px Georgia";
      ctx.fillText("Recuerdo de prueba", 80, 195);
    }, 100);
    await new Promise((resolve) => setTimeout(resolve, 1800));
    clearInterval(timer);
    recorder.stop();
    const blob = await done;
    stream.getTracks().forEach((track) => track.stop());
    return Array.from(new Uint8Array(await blob.arrayBuffer()));
  });
  const title = "Video " + info.project.name;
  await page
    .getByRole("button", { name: "Subir recuerdos", exact: true })
    .click();
  await page.getByLabel("Fotos y videos", { exact: true }).setInputFiles({
    name: "recuerdo.webm",
    mimeType: "video/webm",
    buffer: Buffer.from(recording),
  });
  await page.getByLabel("Título", { exact: true }).fill(title);
  await page.getByRole("button", { name: "Guardar en nuestro rincón" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Mosaico", exact: true }).click();
  await page
    .getByRole("button", { name: "Abrir " + title, exact: true })
    .click();
  const video = page.locator("dialog video");
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.readyState))
    .toBeGreaterThan(0);
  expect(await video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
  await video.evaluate((v: HTMLVideoElement) => v.play());
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime))
    .toBeGreaterThan(0);
  await page.getByRole("button", { name: "Cerrar", exact: true }).click();
  const companion = await page.request.post('/api/media', {headers, multipart: {
    file: {name:'companion.png',mimeType:'image/png',buffer:png},
    title: title + ' compañía', date:'2020-01-01',
  }});
  const companionId = (await companion.json()).id;
  await page.reload();
  await page.getByLabel('Buscar recuerdos').fill(title);
  await page.getByRole('button',{name:'Carrusel',exact:true}).click();
  const inlineVideo = page.locator('.coverflow-card video');
  await expect.poll(()=>inlineVideo.evaluate((v:HTMLVideoElement)=>v.readyState)).toBeGreaterThan(0);
  expect(await inlineVideo.evaluate((v:HTMLVideoElement)=>v.paused)).toBe(true);
  await inlineVideo.evaluate((v:HTMLVideoElement)=>{v.currentTime=0;return v.play();});
  await page.getByRole('button',{name:'Recuerdo siguiente'}).click();
  await expect.poll(()=>inlineVideo.evaluate((v:HTMLVideoElement)=>v.paused)).toBe(true);
  await page.request.delete('/api/media/'+companionId,{headers});
  await assertFits(page);
});

test("private backup downloads original, thumbnail and readable metadata", async ({
  page,
}, info) => {
  await login(page);
  await uploadPhoto(page, "Respaldo " + info.project.name);
  await page
    .getByRole("button", { name: "Personalizar nuestro rincón" })
    .click();
  await page
    .getByRole("button", { name: "Descargar una copia de nuestros recuerdos" })
    .click();
  const waiting = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Descargar nuestros recuerdos", exact: true })
    .click();
  const download = await waiting;
  expect(download.suggestedFilename()).toContain("parte-1-de-1.zip");
  const { unzipSync, strFromU8 } = await import("fflate");
  const files = unzipSync(readFileSync((await download.path())!));
  const manifest = JSON.parse(strFromU8(files["recuerdos.json"]));
  const photo = manifest.media.find(
    (m: { title: string }) => m.title === "Respaldo " + info.project.name,
  );
  expect(photo).toBeTruthy();
  expect(files["archivos/" + photo.id + "/original.png"]).toEqual(
    new Uint8Array(png),
  );
  expect(
    files["archivos/" + photo.id + "/miniatura.webp"].length,
  ).toBeGreaterThan(0);
  await expect(
    page.getByText("Todas las partes están preparadas.", { exact: false }),
  ).toBeVisible();
  await assertFits(page);
});

test("interrupted upload restores its draft after reload without duplicating a committed file", async ({
  page,
}, info) => {
  await login(page);
  const title = "Retomar " + info.project.name;
  await page.route(
    "**/api/media",
    async (route) => {
      if (route.request().method() === "POST") {
        await route.fetch();
        await route.abort("internetdisconnected");
      } else await route.continue();
    },
    { times: 1 },
  );
  await page
    .getByRole("button", { name: "Subir recuerdos", exact: true })
    .click();
  await page
    .getByLabel("Fotos y videos", { exact: true })
    .setInputFiles({ name: "cielo.png", mimeType: "image/png", buffer: png });
  await page.getByLabel("Título", { exact: true }).fill(title);
  await page.getByRole("button", { name: "Guardar en nuestro rincón" }).click();
  await expect(page.getByRole("alert")).toContainText("Algunos archivos");
  await page.reload();
  await page.getByRole("heading", { name: /Nuestros momentos/ }).waitFor();
  await page
    .getByRole("button", { name: "Retomar 1 recuerdo", exact: true })
    .click();
  await expect(
    page.getByText("Recuperamos tu tanda pendiente.", { exact: false }),
  ).toBeVisible();
  await expect(page.getByLabel("Título", { exact: true })).toHaveValue(title);
  await page.getByRole("button", { name: "Guardar en nuestro rincón" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const library = await (await page.request.get("/api/library")).json();
  expect(
    library.media.filter((m: { title: string }) => m.title === title),
  ).toHaveLength(1);
  await page
    .getByRole("button", { name: "Subir recuerdos", exact: true })
    .click();
  await expect(
    page.getByText("Recuperamos tu tanda pendiente.", { exact: false }),
  ).toHaveCount(0);
});

test("iPhone HEIC converts on device into a private viewable JPEG", async ({
  page,
}, info) => {
  await login(page);
  const title = "HEIC " + info.project.name;
  await page
    .getByRole("button", { name: "Subir recuerdos", exact: true })
    .click();
  await page.getByLabel("Fotos y videos", { exact: true }).setInputFiles({
    name: "colores.heic",
    mimeType: "image/heic",
    buffer: readFileSync(new URL("./fixtures/cielo.heic", import.meta.url)),
  });
  await page.getByLabel("Título", { exact: true }).fill(title);
  await page.getByRole("button", { name: "Guardar en nuestro rincón" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const library = await (await page.request.get("/api/library")).json();
  const photo = library.media.find((m: { title: string }) => m.title === title);
  expect(photo.mime).toBe("image/jpeg");
  const original = await page.request.get("/api/files/" + photo.id);
  expect(original.headers()["content-type"]).toContain("image/jpeg");
  await page
    .getByRole("button", { name: "Abrir " + title, exact: true })
    .click();
  await expect
    .poll(() =>
      page
        .locator("dialog img")
        .first()
        .evaluate((i: HTMLImageElement) => i.naturalWidth),
    )
    .toBeGreaterThan(0);
});

test("personal cover, calendar counter and featured memory persist after reload", async ({
  page,
}, info) => {
  await login(page);
  const title = "Portada " + info.project.name;
  await uploadPhoto(page, title);
  await page
    .getByRole("button", { name: "Personalizar nuestro rincón" })
    .click();
  await page.getByLabel("Juntos desde", { exact: true }).fill("2020-01-01");
  await page
    .getByLabel("Foto de portada", { exact: true })
    .selectOption({ label: title });
  await page
    .getByLabel("Recuerdo destacado", { exact: true })
    .selectOption({ label: title });
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.reload();
  await expect(
    page
      .getByRole("button", { name: "Ver nuestra foto de portada" })
      .locator("img"),
  ).toHaveAttribute("alt", title);
  await expect(page.locator(".days-together")).toContainText("días juntos");
  await page
    .getByRole("button", { name: "Revivir " + title, exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Cerrar", exact: true }).click();
  await assertFits(page);
  await page.screenshot({
    path: "test-results/personal-cover-" + info.project.name + ".png",
    fullPage: true,
  });
});

test("same-day memories and album cards navigate real dated photos", async ({
  page,
}, info) => {
  await login(page);
  const now = new Date(),
    day = [
      now.getFullYear() - 4,
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");
  const title = "Nuestro día " + info.project.name;
  await page
    .getByRole("button", { name: "Subir recuerdos", exact: true })
    .click();
  await page
    .getByLabel("Fotos y videos", { exact: true })
    .setInputFiles({ name: "cielo.png", mimeType: "image/png", buffer: png });
  await page.getByLabel("Título", { exact: true }).fill(title);
  await page.getByLabel("Fecha del recuerdo", { exact: true }).fill(day);
  await page.getByRole("button", { name: "Aniversarios", exact: true }).click();
  await page.getByRole("button", { name: "Guardar en nuestro rincón" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Volver a " + title, exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Ver todos los recuerdos de este día" })
    .click();
  await expect(
    page.getByRole("button", { name: "Abrir " + title, exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Quitar filtro de fecha o álbum" })
    .click();
  await page
    .getByRole("button", { name: "Ver álbum Aniversarios", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Ver álbum Aniversarios", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("status").filter({ hasText: "Álbum: Aniversarios" }),
  ).toBeVisible();
  await assertFits(page);
});

test("logout removes private pending files and TUS references from the device", async ({
  page,
}) => {
  await login(page);
  await page
    .getByRole("button", { name: "Subir recuerdos", exact: true })
    .click();
  await page
    .getByLabel("Fotos y videos", { exact: true })
    .setInputFiles({
      name: "pendiente.png",
      mimeType: "image/png",
      buffer: png,
    });
  await page.getByRole("button", { name: "Cerrar", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Retomar 1 recuerdo", exact: true }),
  ).toBeVisible();
  await page.evaluate(() => localStorage.setItem("tus::rincon-test::1", "{}"));
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await page.getByLabel("Nuestra contraseña").waitFor();
  expect(
    await page.evaluate(() => localStorage.getItem("tus::rincon-test::1")),
  ).toBeNull();
  const count = await page.evaluate(
    () =>
      new Promise<number>((resolve, reject) => {
        const open = indexedDB.open("rincon-pending-uploads", 1);
        open.onsuccess = () => {
          const db = open.result,
            request = db.transaction("drafts").objectStore("drafts").count();
          request.onsuccess = () => {
            resolve(request.result);
            db.close();
          };
          request.onerror = reject;
        };
        open.onerror = reject;
      }),
  );
  expect(count).toBe(0);
});

test("coverflow: circular navigation, side selection, swipe, keyboard and reduced motion", async ({ page }, info) => {
  await login(page);
  const ids: string[] = [];
  try {
    for (let i = 1; i <= 5; i++) {
      const response = await page.request.post('/api/media', { headers, multipart: {
        file: {name: 'demo.png', mimeType: 'image/png', buffer: png},
        title: 'Demo carrusel ' + i, album: 'Coverflow ' + info.project.name,
        date: '2026-09-0' + i,
      }});
      expect(response.status()).toBe(201);
      ids.push((await response.json()).id);
    }
    await page.reload();
    await page.getByRole('button', {name:'Mostrar filtros'}).click();
    await page.getByRole('combobox', {name:'Álbum',exact:true}).selectOption('Coverflow ' + info.project.name);
    await page.getByRole('button', {name:'Carrusel',exact:true}).click();
    const stage = page.getByRole('region', {name:'Carrusel de recuerdos'});
    await expect(stage.locator('.coverflow-card')).toHaveCount(5);
    await expect(stage.locator('.is-active img')).toHaveAttribute('alt','Demo carrusel 5');
    await expect(page.getByRole('button',{name:'Pausar',exact:true})).toBeVisible();
    await expect(stage.locator('.is-active img')).toHaveAttribute('alt','Demo carrusel 4',{timeout:9000});
    await page.getByRole('button',{name:'Pausar',exact:true}).click();
    await expect(page.getByRole('button',{name:'Presentación',exact:true})).toBeVisible();
    await stage.getByRole('button',{name:'Recuerdo anterior'}).click();
    await expect(stage.locator('.is-active img')).toHaveAttribute('alt','Demo carrusel 5');
    await stage.getByRole('button', {name:'Recuerdo anterior'}).click();
    await expect(stage.locator('.is-active img')).toHaveAttribute('alt','Demo carrusel 1');
    await stage.focus();
    await page.keyboard.press('ArrowRight');
    await expect(stage.locator('.is-active img')).toHaveAttribute('alt','Demo carrusel 5');
    const side = stage.getByRole('button', {name:'Ir a Demo carrusel 4',exact:true});
    // A perspective card overlaps its neighbors: click its exposed surface,
    // rather than scrolling its projected bounding box into the clipped stage.
    await expect.poll(()=>side.evaluate(el=>el.parentElement!.getAnimations().length)).toBe(0);
    const sidePoint = await side.evaluate(el => {
      const rect = el.getBoundingClientRect();
      for(const y of [.25,.75,.5]) for(const x of [.25,.5,.75]) {
        const point = {x:rect.left+rect.width*x,y:rect.top+rect.height*y};
        if(document.elementFromPoint(point.x,point.y)===el) return point;
      }
      return null;
    });
    expect(sidePoint, 'La tarjeta lateral ofrece una superficie visible para tocar').not.toBeNull();
    await page.mouse.click(sidePoint!.x,sidePoint!.y);
    await expect(stage.locator('.is-active img')).toHaveAttribute('alt','Demo carrusel 4');
    await stage.evaluate(el => { const event = new Event('touchstart', {bubbles:true}); Object.defineProperty(event, 'touches', {value:[{clientX:230,clientY:200}]}); el.dispatchEvent(event); });
    await stage.evaluate(el => { const event = new Event('touchend', {bubbles:true}); Object.defineProperty(event, 'changedTouches', {value:[{clientX:100,clientY:210}]}); el.dispatchEvent(event); });
    await expect(stage.locator('.is-active img')).toHaveAttribute('alt','Demo carrusel 3');
    await stage.evaluate(el => { const event = new Event('touchstart', {bubbles:true}); Object.defineProperty(event, 'touches', {value:[{clientX:230,clientY:200}]}); el.dispatchEvent(event); });
    await stage.evaluate(el => { const event = new Event('touchend', {bubbles:true}); Object.defineProperty(event, 'changedTouches', {value:[{clientX:130,clientY:400}]}); el.dispatchEvent(event); });
    await expect(stage.locator('.is-active img')).toHaveAttribute('alt','Demo carrusel 3');
    await expect.poll(()=>stage.locator('.is-active').evaluate(el=>el.getAnimations().length)).toBe(0);
    await assertFits(page);
    await stage.screenshot({path:'test-results/' + info.project.name + '-coverflow.png'});
    await stage.getByRole('button',{name:'Ver Demo carrusel 3',exact:true}).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await page.emulateMedia({reducedMotion:'reduce'});
    expect(await stage.locator('.is-active').evaluate(el=>getComputedStyle(el).transitionDuration)).toBe('0s');
    await expect(page.getByRole('button',{name:'Presentación',exact:true})).toBeDisabled();
    await stage.getByRole('button',{name:'Recuerdo siguiente'}).click();
    await expect(stage.locator('.is-active img')).toHaveAttribute('alt','Demo carrusel 2');
    await page.emulateMedia({reducedMotion:'no-preference'});
    if(info.project.name==='mobile') {
      await page.setViewportSize({width:360,height:780}); await assertFits(page);
    }
    for(const id of ids.slice(2)) await page.request.delete('/api/media/'+id,{headers});
    const reloadAlbum = async () => {
      await page.reload();
      await page.getByRole('button',{name:'Mostrar filtros'}).click();
      await page.getByRole('combobox',{name:'Álbum',exact:true}).selectOption('Coverflow ' + info.project.name);
    };
    await reloadAlbum();
    await expect(stage.locator('.coverflow-card')).toHaveCount(2);
    await stage.getByRole('button',{name:'Recuerdo siguiente'}).click();
    await expect(stage.locator('.is-active img')).toHaveAttribute('alt','Demo carrusel 1');
    await page.request.delete('/api/media/'+ids[0],{headers});
    await reloadAlbum();
    await expect(stage.locator('.coverflow-card')).toHaveCount(1);
    await expect(stage.getByRole('button',{name:'Recuerdo siguiente'})).toHaveCount(0);
    await assertFits(page);
  } finally {
    for(const id of ids) await page.request.delete('/api/media/'+id,{headers});
  }
});
for (const mode of ["normal", "blocked", "native-volume-ignored"] as const) {
  test("background music: " + mode, async ({ page }, info) => {
    const samples = 44100 * 40;
    const wav = Buffer.alloc(44 + samples * 2);
    wav.write("RIFF"); wav.writeUInt32LE(36 + samples * 2, 4);
    wav.write("WAVE", 8); wav.write("fmt ", 12);
    wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20);
    wav.writeUInt16LE(1, 22); wav.writeUInt32LE(44100, 24);
    wav.writeUInt32LE(88200, 28); wav.writeUInt16LE(2, 32);
    wav.writeUInt16LE(16, 34); wav.write("data", 36);
    wav.writeUInt32LE(samples * 2, 40);
    for (let i = 0; i < samples; i++) wav.writeInt16LE(Math.round(Math.sin(i / 44100 * Math.PI * 440) * 1000), 44 + i * 2);
    await page.addInitScript((mode) => {
      Math.random = () => 0.75;
      if (mode === "blocked") {
        const play = HTMLMediaElement.prototype.play;
        let first = true;
        HTMLMediaElement.prototype.play = function () {
          if (first) { first = false; return Promise.reject(new DOMException("Autoplay blocked", "NotAllowedError")); }
          return play.call(this);
        };
      }
      if (mode === "native-volume-ignored") {
        Object.defineProperty(HTMLMediaElement.prototype, "volume", { configurable: true, get: () => 1, set: () => {} });
        const createGain = AudioContext.prototype.createGain;
        AudioContext.prototype.createGain = function () {
          const gain = createGain.call(this);
          (window as unknown as { testGain: GainNode }).testGain = gain;
          return gain;
        };
      }
    }, mode);
    await page.route("**/api/library", async route => {
      const original = await (await route.fetch()).json();
      original.media = [0, 1].map(i => ({ id: "demo-song-" + i, kind: "audio", title: "Canción demo " + i, artist: "Demo", date: "2026-10-08", album: "", tags: [], favorite: false, mime: "audio/wav", size: wav.length, createdAt: "2026-10-08T12:00:00Z" }));
      await route.fulfill({ json: original });
    });
    await page.route("**/api/files/demo-song-*", route => route.fulfill({ contentType: "audio/wav", body: wav }));
    await login(page);
    const player = page.getByRole("complementary", { name: "Reproductor de música" });
    await expect(player).toContainText("Canción demo 1");
    await expect(page.getByRole("slider", { name: "Volumen", exact: true })).toHaveValue("0.15");
    if (mode === "blocked") {
      await expect(page.getByRole("button", { name: "Activar música de fondo" })).toBeVisible();
      expect(await page.locator("audio").evaluate((a: HTMLAudioElement) => a.paused)).toBe(true);
      await page.getByRole("button", { name: "Activar música de fondo" }).click();
    }
    await expect(page.getByRole("button", { name: "Pausar música" })).toBeVisible();
    await expect.poll(() => page.locator("audio").evaluate((a: HTMLAudioElement) => a.currentTime)).toBeGreaterThan(0);
    if (mode === "native-volume-ignored") {
      expect(await page.evaluate(() => (window as unknown as { testGain: GainNode }).testGain.gain.value)).toBeCloseTo(0.15);
    } else expect(await page.locator("audio").evaluate((a: HTMLAudioElement) => a.volume)).toBe(0.15);
    await page.getByRole("button", { name: "Música", exact: true }).click();
    await page.getByRole("slider", { name: "Volumen", exact: true }).focus();
    await page.keyboard.press("End");
    await expect(page.getByRole("slider", { name: "Volumen", exact: true })).toHaveValue("1");
    if (mode === "native-volume-ignored") {
      expect(await page.evaluate(() => (window as unknown as { testGain: GainNode }).testGain.gain.value)).toBe(1);
    } else expect(await page.locator("audio").evaluate((a: HTMLAudioElement) => a.volume)).toBe(1);
    await page.getByRole("button", { name: "Canción siguiente" }).click();
    await expect(player).toContainText("Canción demo 0");
    await page.getByRole("button", { name: "Pausar música" }).click();
    await page.getByRole("button", { name: "Palabras", exact: true }).click();
    await expect(page.getByRole("slider", { name: "Volumen", exact: true })).toHaveValue("1");
    expect(await page.locator("audio").evaluate((a: HTMLAudioElement) => a.paused)).toBe(true);
    await assertFits(page);
    if (info.project.name === "mobile") { await page.setViewportSize({ width: 360, height: 780 }); await assertFits(page); }
    await player.screenshot({ path: "test-results/" + info.project.name + "-background-" + mode + ".png" });
    await page.getByRole("button", { name: "Cerrar reproductor" }).click();
    await page.getByRole("button", { name: "Música", exact: true }).click();
    await expect(player).toHaveCount(0);
    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await expect(page.locator("audio")).toHaveCount(0);
  });
}

test("responsive albums stay contained and modal fits with many memories", async ({ page }, info) => {
  const media = Array.from({ length: 16 }, (_, i) => ({ id: "demo-responsive-" + i, kind: "photo", title: "Vista demo " + i + " · " + "Un recuerdo muy especial juntos ".repeat(8), date: "2026-09-01", album: "Álbum " + String(i).padStart(2, "0") + " · " + "Juntos".repeat(6), tags: ["Demo"], favorite: false, artist: "", mime: "image/png", size: png.length, createdAt: "2026-09-01T12:00:00Z" }));
  await page.route("**/api/library", async route => {
    const original = await (await route.fetch()).json();
    await route.fulfill({ json: { ...original, media, notes: [], settings: { names: "Ailu y Tomy", title: "Nuestro rincón", since: "2026-08-29", coverId: media[0].id, featuredId: media[1].id } } });
  });
  await page.route("**/api/files/demo-responsive-*", route => route.fulfill({ contentType: "image/png", body: png }));
  await login(page);
  for (const width of info.project.name === "mobile" ? [360, 390] : [740, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await assertFits(page);
    const albums = page.getByRole("region", { name: "Nuestros álbumes", exact: true });
    const strip = albums.locator(".album-cards");
    const next = albums.getByRole("button", { name: "Álbumes siguientes" });
    const previous = albums.getByRole("button", { name: "Álbumes anteriores" });
    await strip.evaluate(el => { el.scrollLeft = 0; });
    await expect(previous).toBeDisabled();
    await expect(next).toBeEnabled();
    expect(await strip.evaluate(el => el.scrollWidth > el.clientWidth)).toBe(true);
    await next.click();
    await expect.poll(() => strip.evaluate(el => el.scrollLeft)).toBeGreaterThan(50);
    await expect(previous).toBeEnabled();
    await previous.click();
    await expect.poll(() => strip.evaluate(el => el.scrollLeft)).toBeLessThan(2);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await next.click();
    await expect.poll(() => strip.evaluate(el => el.scrollLeft)).toBeGreaterThan(50);
    await strip.evaluate(el => { el.scrollLeft = el.scrollWidth; });
    await expect(next).toBeDisabled();
    await albums.getByRole("button", { name: "Ver álbum " + media[15].album, exact: true }).click();
    await expect(page.locator(".active-memory-filter")).toContainText(media[15].album);
    await assertFits(page);
    await page.getByRole("button", { name: "Ver nuestra foto de portada" }).click();
    const dialog = page.getByRole("dialog", { name: "Un momento nuestro" });
    await expect(dialog).toBeVisible();
    const bounds = await dialog.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width + 1);
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(845);
    await expect(dialog.getByRole("button", { name: "Cerrar", exact: true })).toBeInViewport();
    await expect(dialog.locator(".viewer-stage img")).toBeInViewport();
    await assertFits(page);
    await page.screenshot({ path: "test-results/responsive-modal-" + width + ".png" });
    await dialog.getByRole("button", { name: "Cerrar", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await albums.scrollIntoViewIfNeeded();
    await page.screenshot({ path: "test-results/responsive-albums-" + width + ".png" });
    await page.emulateMedia({ reducedMotion: "no-preference" });
  }
});
