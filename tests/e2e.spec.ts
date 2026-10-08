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
test("audio plays only on request and stays mounted when navigating", async ({
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
  await page
    .getByLabel("Fotos y videos", { exact: true })
    .setInputFiles({
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
  await assertFits(page);
});

test('private backup downloads original, thumbnail and readable metadata', async ({page},info)=>{
 await login(page);await uploadPhoto(page,'Respaldo '+info.project.name);
 await page.getByRole('button',{name:'Personalizar nuestro rincón'}).click();
 await page.getByRole('button',{name:'Descargar una copia de nuestros recuerdos'}).click();
 const waiting=page.waitForEvent('download');await page.getByRole('button',{name:'Descargar nuestros recuerdos',exact:true}).click();
 const download=await waiting;expect(download.suggestedFilename()).toContain('parte-1-de-1.zip');
 const {unzipSync,strFromU8}=await import('fflate');const files=unzipSync(readFileSync((await download.path())!));
 const manifest=JSON.parse(strFromU8(files['recuerdos.json']));
 const photo=manifest.media.find((m:{title:string})=>m.title==='Respaldo '+info.project.name);expect(photo).toBeTruthy();
 expect(files['archivos/'+photo.id+'/original.png']).toEqual(new Uint8Array(png));
 expect(files['archivos/'+photo.id+'/miniatura.webp'].length).toBeGreaterThan(0);
 await expect(page.getByText('Todas las partes están preparadas.',{exact:false})).toBeVisible();await assertFits(page);
});

test('interrupted upload restores its draft after reload without duplicating a committed file',async({page},info)=>{
 await login(page);const title='Retomar '+info.project.name;
 await page.route('**/api/media',async route=>{if(route.request().method()==='POST'){await route.fetch();await route.abort('internetdisconnected');}else await route.continue();},{times:1});
 await page.getByRole('button',{name:'Subir recuerdos',exact:true}).click();
 await page.getByLabel('Fotos y videos',{exact:true}).setInputFiles({name:'cielo.png',mimeType:'image/png',buffer:png});
 await page.getByLabel('Título',{exact:true}).fill(title);
 await page.getByRole('button',{name:'Guardar en nuestro rincón'}).click();
 await expect(page.getByRole('alert')).toContainText('Algunos archivos');
 await page.reload();await page.getByRole('heading',{name:/Nuestros momentos/}).waitFor();
 await page.getByRole('button',{name:'Subir recuerdos',exact:true}).click();
 await expect(page.getByText('Recuperamos tu tanda pendiente.',{exact:false})).toBeVisible();
 await expect(page.getByLabel('Título',{exact:true})).toHaveValue(title);
 await page.getByRole('button',{name:'Guardar en nuestro rincón'}).click();
 await expect(page.getByRole('dialog')).toHaveCount(0);
 const library=await (await page.request.get('/api/library')).json();
 expect(library.media.filter((m:{title:string})=>m.title===title)).toHaveLength(1);
 await page.getByRole('button',{name:'Subir recuerdos',exact:true}).click();
 await expect(page.getByText('Recuperamos tu tanda pendiente.',{exact:false})).toHaveCount(0);
});

test('iPhone HEIC converts on device into a private viewable JPEG',async({page},info)=>{
 await login(page);const title='HEIC '+info.project.name;
 await page.getByRole('button',{name:'Subir recuerdos',exact:true}).click();
 await page.getByLabel('Fotos y videos',{exact:true}).setInputFiles({name:'colores.heic',mimeType:'image/heic',buffer:readFileSync(new URL('./fixtures/cielo.heic',import.meta.url))});
 await page.getByLabel('Título',{exact:true}).fill(title);await page.getByRole('button',{name:'Guardar en nuestro rincón'}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
 const library=await (await page.request.get('/api/library')).json();const photo=library.media.find((m:{title:string})=>m.title===title);expect(photo.mime).toBe('image/jpeg');
 const original=await page.request.get('/api/files/'+photo.id);expect(original.headers()['content-type']).toContain('image/jpeg');
 await page.getByRole('button',{name:'Abrir '+title,exact:true}).click();await expect.poll(()=>page.locator('dialog img').first().evaluate((i:HTMLImageElement)=>i.naturalWidth)).toBeGreaterThan(0);
});
