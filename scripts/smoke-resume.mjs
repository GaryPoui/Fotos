// Synthetic 7 MiB WAV. Interrupt after the first persisted TUS chunk, reload, resume.
import { chromium } from "playwright";
try {
  process.loadEnvFile();
} catch {}
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.setDefaultTimeout(30000);
const title = "Prueba reanudación " + Date.now();
let paused = false,
  resumedOffset = 0;
page.on("response", async (r) => {
  if (r.request().method() === "HEAD" && r.url().includes("/upload/resumable/"))
    resumedOffset = Number((await r.allHeaders())["upload-offset"]);
});
try {
  await page.goto(process.argv[2]);
  await page.getByLabel("Nuestra contraseña").fill(process.env.APP_PASSWORD);
  await page.getByRole("button", { name: "Entrar a nuestro rincón" }).click();
  await page.getByRole("button", { name: "Música", exact: true }).click();
  await page
    .getByRole("button", { name: "Subir canción", exact: true })
    .click();
  const wav = Buffer.alloc(7 * 1024 * 1024);
  wav.write("RIFF");
  wav.writeUInt32LE(wav.length - 8, 4);
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
  wav.writeUInt32LE(wav.length - 44, 40);
  await page
    .getByLabel("Archivos de música")
    .setInputFiles({
      name: "reanudar.wav",
      mimeType: "audio/wav",
      buffer: wav,
    });
  await page.getByLabel("Título", { exact: true }).fill(title);
  await page.route("**/storage/v1/upload/resumable/**", async (route) => {
    if (route.request().method() === "PATCH" && !paused) {
      paused = true;
      await page
        .getByRole("button", { name: "Pausar subida", exact: true })
        .click();
      await route.abort();
    } else await route.continue();
  });
  await page.getByRole("button", { name: "Guardar en nuestro rincón" }).click();
  await page.getByRole("alert").filter({ hasText: "Tanda pausada" }).waitFor();
  await page.unroute("**/storage/v1/upload/resumable/**");
  await page.reload();
  await page.getByRole("heading", { name: /Nuestros momentos/ }).waitFor();
  await page.getByRole("button", { name: "Música", exact: true }).click();
  await page
    .getByRole("button", { name: "Subir canción", exact: true })
    .click();
  await page
    .getByText("Recuperamos tu tanda pendiente.", { exact: false })
    .waitFor();
  await page.getByRole("button", { name: "Guardar en nuestro rincón" }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  if (!paused || resumedOffset !== 6 * 1024 * 1024)
    throw new Error("Expected persisted chunk offset, got " + resumedOffset);
  await page
    .getByRole("button", { name: "Eliminar canción " + title, exact: true })
    .click();
  await page.getByRole("button", { name: "Eliminar", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  console.log(
    "Real TUS: paused after 6 MiB, restored queue, resumed offset 6291456, committed once and removed: PASS",
  );
} catch (e) {
  console.error((await page.locator("body").innerText()).slice(-800));
  throw e;
} finally {
  await browser.close();
}
