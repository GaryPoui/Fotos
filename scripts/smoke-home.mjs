// Only synthetic photo/album. Preserve the user's names, dates and cover selections.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { unzipSync, strFromU8 } from "fflate";
try {
  process.loadEnvFile();
} catch {}
const browser = await chromium.launch(),
  page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.setDefaultTimeout(30000);
const title = "Prueba portada " + Date.now(),
  album = "Prueba álbum " + Date.now();
let originalCover = "",
  originalFeatured = "",
  id = "",
  uploaded = false;
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
try {
  await page.goto(process.argv[2]);
  await page.getByLabel("Nuestra contraseña").fill(process.env.APP_PASSWORD);
  await page.getByRole("button", { name: "Entrar a nuestro rincón" }).click();
  await page.getByRole("heading", { name: /Nuestros momentos/ }).waitFor();
  await page
    .getByRole("button", { name: "Personalizar nuestro rincón" })
    .click();
  originalCover = await page
    .getByLabel("Foto de portada", { exact: true })
    .inputValue();
  originalFeatured = await page
    .getByLabel("Recuerdo destacado", { exact: true })
    .inputValue();
  await page.getByRole("button", { name: "Cerrar", exact: true }).click();
  await page
    .getByRole("button", { name: "Subir recuerdos", exact: true })
    .click();
  await page
    .getByLabel("Fotos y videos", { exact: true })
    .setInputFiles({
      name: "cielo.png",
      mimeType: "image/png",
      buffer: readFileSync("tests/fixtures/cielo.png"),
    });
  await page.getByLabel("Título", { exact: true }).fill(title);
  const now = new Date(),
    date = [
      now.getFullYear() - 4,
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");
  await page.getByLabel("Fecha del recuerdo", { exact: true }).fill(date);
  await page.getByLabel("Álbum", { exact: true }).fill(album);
  await page.getByRole("button", { name: "Guardar en nuestro rincón" }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  uploaded = true;
  const card = page.getByRole("button", {
    name: "Abrir " + title,
    exact: true,
  });
  id = (await card.locator("img").getAttribute("src"))
    .split("/")
    .pop()
    .split("?")[0];
  await page
    .getByRole("button", { name: "Personalizar nuestro rincón" })
    .click();
  await page.getByLabel("Foto de portada", { exact: true }).selectOption(id);
  await page.getByLabel("Recuerdo destacado", { exact: true }).selectOption(id);
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.reload();
  await page
    .getByRole("button", { name: "Revivir " + title, exact: true })
    .waitFor();
  if (
    (await page
      .getByRole("button", { name: "Ver nuestra foto de portada" })
      .locator("img")
      .getAttribute("alt")) !== title
  )
    throw new Error("Cover did not persist");
  await page
    .getByRole("button", { name: "Volver a " + title, exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Ver álbum " + album, exact: true })
    .click();
  await card.waitFor();
  if (
    (await page
      .getByRole("button", { name: "Ver álbum " + album, exact: true })
      .getAttribute("aria-pressed")) !== "true"
  )
    throw new Error("Album filter failed");
  await page
    .getByRole("button", { name: "Quitar filtro de fecha o álbum" })
    .click();
  console.log(
    "Real Firestore: selected cover/featured persist; dated memories and private album navigation PASS",
  );
  const usedText = await page.locator(".page-footer small").innerText();
  const used = Number(usedText.split(" ")[0]);
  if (usedText.includes("MB") && used < 20) {
    await page
      .getByRole("button", { name: "Personalizar nuestro rincón" })
      .click();
    await page
      .getByRole("button", {
        name: "Descargar una copia de nuestros recuerdos",
      })
      .click();
    const waiting = page.waitForEvent("download");
    await page
      .getByRole("button", {
        name: "Descargar nuestros recuerdos",
        exact: true,
      })
      .click();
    const download = await waiting,
      files = unzipSync(readFileSync(await download.path()));
    const manifest = JSON.parse(strFromU8(files["recuerdos.json"]));
    if (
      !files["archivos/" + id + "/original.png"] ||
      !files["archivos/" + id + "/miniatura.webp"] ||
      !manifest.media.some((m) => m.id === id)
    )
      throw new Error("Cloud backup incomplete");
    console.log("Real private ZIP: original, thumbnail and metadata PASS");
  }
  if (errors.length) throw new Error(JSON.stringify(errors));
} finally {
  try {
    if (uploaded) {
      await page.goto(process.argv[2]);
      await page.getByRole("heading", { name: /Nuestros momentos/ }).waitFor();
      await page
        .getByRole("button", { name: "Personalizar nuestro rincón" })
        .click();
      let changed = false;
      for (const [label, original] of [
        ["Foto de portada", originalCover],
        ["Recuerdo destacado", originalFeatured],
      ]) {
        const select = page.getByLabel(label, { exact: true });
        if ((await select.inputValue()) === id) {
          const available = await select
            .locator("option")
            .evaluateAll((options) => options.map((o) => o.value));
          await select.selectOption(
            available.includes(original) ? original : "",
          );
          changed = true;
        }
      }
      if (changed) {
        await page
          .getByRole("button", { name: "Guardar", exact: true })
          .click();
        await page.getByRole("dialog").waitFor({ state: "hidden" });
      } else
        await page.getByRole("button", { name: "Cerrar", exact: true }).click();
      await page
        .getByRole("button", { name: "Abrir " + title, exact: true })
        .click();
      await page.getByRole("button", { name: "Eliminar recuerdo" }).click();
      await page.getByRole("button", { name: "Eliminar", exact: true }).click();
      await page.getByRole("dialog").waitFor({ state: "hidden" });
      console.log(
        "Original cover selections restored; only synthetic photo/album removed",
      );
    }
  } finally {
    await browser.close();
  }
}
