import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
const png = readFileSync(new URL("./fixtures/cielo.png", import.meta.url));
const headers = { "X-Requested-With": "NuestroRincon" };
async function login(page: Page) {
  await page.route("https://tile.openstreetmap.org/**", (route) =>
    route.fulfill({ contentType: "image/png", body: png }),
  );
  await page.goto("/");
  await page
    .getByLabel("Nuestra contraseña")
    .fill("browser-test-password-2026");
  await page.getByRole("button", { name: "Entrar a nuestro rincón" }).click();
  await page.getByRole("button", { name: "Mapa", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Mapa de nuestros lugares" }),
  ).toBeVisible();
}
async function fits(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    await page.locator("button:visible").evaluateAll((buttons) =>
      buttons
        .filter((button) => {
          const r = button.getBoundingClientRect();
          return r.width < 43.9 || r.height < 43.9;
        })
        .map(
          (button) => button.getAttribute("aria-label") || button.textContent,
        ),
    ),
  ).toEqual([]);
}
test("places map saves, reloads, filters, edits and removes with confirmation without touching memories", async ({
  page,
}, info) => {
  await login(page);
  if (info.project.name === "mobile")
    await page.setViewportSize({ width: 360, height: 900 });
  const before = await (await page.request.get("/api/library")).json();
  const title = "Café de ejemplo " + info.project.name;
  let ids: string[] = [];
  try {
    await page.route("**/api/places/resolve", (route) =>
      route.fulfill({
        json: {
          results: [
            {
              name: "Café de ejemplo",
              address: "Corrientes 100, Buenos Aires",
              lat: -34.6037,
              lng: -58.3816,
              addressApproximate: true,
            },
          ],
        },
      }),
    );
    await page
      .getByRole("button", { name: "Agregar lugar", exact: true })
      .click();
    await page
      .getByLabel("Dirección o enlace de Google Maps")
      .fill(
        "https://www.google.com/maps/search/?api=1&query=-34.6037,-58.3816",
      );
    await expect(page.getByLabel("Dirección guardada")).toHaveValue(
      "Corrientes 100, Buenos Aires",
    );
    await page.getByLabel("Nombre del lugar", { exact: true }).fill(title);
    await page
      .getByLabel("Nota sobre este lugar")
      .fill("Una tarde juntos — ejemplo");
    await fits(page);
    let fail = true;
    await page.route("**/api/places", async (route) => {
      if (fail) {
        fail = false;
        await route.fulfill({
          status: 503,
          json: { error: "Ejemplo: conexión interrumpida" },
        });
      } else await route.continue();
    });
    await page
      .getByRole("button", { name: "Guardar lugar", exact: true })
      .click();
    await expect(page.getByRole("alert")).toContainText(
      "conexión interrumpida",
    );
    await expect(
      page.getByLabel("Nombre del lugar", { exact: true }),
    ).toHaveValue(title);
    await page
      .getByRole("button", { name: "Guardar lugar", exact: true })
      .click();
    await expect(page.locator(".place-editor")).toHaveCount(0);
    let library = await (await page.request.get("/api/library")).json();
    const saved = library.places.find(
      (place: { name: string }) => place.name === title,
    );
    ids.push(saved.id);
    const second = await page.request.post("/api/places", {
      headers,
      data: {
        name: "Restaurante de ejemplo",
        category: "restaurant",
        address: "Buenos Aires",
        note: "",
        lat: -34.606,
        lng: -58.385,
      },
    });
    expect(second.ok()).toBe(true);
    ids.push((await second.json()).id);
    await page.reload();
    await page.getByRole("button", { name: "Mapa", exact: true }).click();
    await expect(page.locator(".place-marker")).toHaveCount(2);
    const filters = page.getByRole("group", {
      name: "Filtrar lugares por categoría",
    });
    await filters.getByRole("button", { name: "Cafés", exact: true }).click();
    await expect(page.locator(".places-list li")).toHaveCount(1);
    await expect(page.locator(".place-marker")).toHaveCount(1);
    await page
      .getByRole("button", { name: "Ver en mapa: " + title, exact: true })
      .click();
    await expect(
      page.getByRole("region", { name: "Detalle del lugar" }),
    ).toContainText("Una tarde juntos");
    await page
      .getByRole("button", { name: "Editar lugar", exact: true })
      .click();
    await page
      .getByLabel("Nombre del lugar", { exact: true })
      .fill("Cambio cancelado");
    await page.getByRole("button", { name: "Cancelar", exact: true }).click();
    await expect(
      page.getByRole("region", { name: "Detalle del lugar" }),
    ).toContainText(title);
    await page
      .getByRole("button", { name: "Editar lugar", exact: true })
      .click();
    await page
      .getByLabel("Nombre del lugar", { exact: true })
      .fill(title + " renovado");
    await page
      .getByLabel("Categoría", { exact: true })
      .selectOption("shopping");
    await page
      .getByRole("button", { name: "Guardar lugar", exact: true })
      .click();
    await expect(page.locator(".place-editor")).toHaveCount(0);
    await filters
      .getByRole("button", { name: "Shoppings", exact: true })
      .click();
    await expect(page.locator(".place-marker")).toHaveCount(1);
    await page
      .getByRole("button", {
        name: "Ver lugar: " + title + " renovado · Shoppings",
        exact: true,
      })
      .press("Enter");
    await expect(
      page.getByRole("region", { name: "Detalle del lugar" }),
    ).toContainText(title + " renovado");
    await fits(page);
    await page.screenshot({
      path: "test-results/map-" + info.project.name + ".png",
    });
    await page
      .getByRole("button", { name: "Quitar lugar", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Conservar lugar", exact: true })
      .click();
    library = await (await page.request.get("/api/library")).json();
    expect(library.places).toHaveLength(2);
    await page
      .getByRole("button", { name: "Quitar lugar", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Confirmar quitar", exact: true })
      .click();
    await expect(
      page.getByRole("region", { name: "Detalle del lugar" }),
    ).toHaveCount(0);
    library = await (await page.request.get("/api/library")).json();
    expect(library.places).toHaveLength(1);
    expect(library.media).toEqual(before.media);
    expect(library.notes).toEqual(before.notes);
    expect(library.settings).toEqual(before.settings);
    expect(library.albums).toEqual(before.albums);
  } finally {
    for (const id of ids)
      await page.request.delete("/api/places/" + id, { headers });
  }
});

test("Maps links fill the draft automatically, preserve corrections and discard stale replies without saving", async ({
  page,
}) => {
  await login(page);
  const before = (await (await page.request.get("/api/library")).json()).places;
  let releaseFirst!: () => void;
  const firstPending = new Promise<void>((resolve) => {
    releaseFirst = resolve;
  });
  let releaseThird!: () => void;
  const thirdPending = new Promise<void>((resolve) => {
    releaseThird = resolve;
  });
  const queries: string[] = [];
  await page.route("**/api/places/resolve", async (route) => {
    const query = route.request().postDataJSON().query as string;
    queries.push(query);
    if (query.endsWith("first")) await firstPending;
    if (query.endsWith("third")) await thirdPending;
    const title = query.endsWith("second")
      ? "Segundo café"
      : query.endsWith("third")
        ? "Tercer café"
        : "Primer café";
    await route.fulfill({
      json: {
        results: [
          {
            name: title,
            address: title + " 100, Buenos Aires",
            lat: -34.6037,
            lng: -58.3816,
            addressApproximate: true,
          },
        ],
      },
    });
  });
  await page
    .getByRole("button", { name: "Agregar lugar", exact: true })
    .click();
  const query = page.getByLabel("Dirección o enlace de Google Maps");
  await query.fill("https://maps.app.goo.gl/first");
  await expect.poll(() => queries.length).toBe(1);
  await query.fill("https://maps.app.goo.gl/second");
  await expect(
    page.getByLabel("Nombre del lugar", { exact: true }),
  ).toHaveValue("Segundo café");
  await expect(page.getByLabel("Dirección guardada")).toHaveValue(
    "Segundo café 100, Buenos Aires",
  );
  releaseFirst();
  await expect(
    page.getByLabel("Nombre del lugar", { exact: true }),
  ).toHaveValue("Segundo café");
  await query.fill("https://maps.app.goo.gl/third");
  await expect.poll(() => queries.length).toBe(3);
  await page
    .getByLabel("Nombre del lugar", { exact: true })
    .fill("Nuestro nombre personal");
  await page.getByLabel("Dirección guardada").fill("Mi corrección 123");
  releaseThird();
  await expect(
    page.getByRole("button", { name: "Guardar lugar", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByLabel("Nombre del lugar", { exact: true }),
  ).toHaveValue("Nuestro nombre personal");
  await expect(page.getByLabel("Dirección guardada")).toHaveValue(
    "Mi corrección 123",
  );
  await expect(page.locator(".place-search-results")).toHaveCount(0);
  expect(queries).toHaveLength(3);
  expect(
    (await (await page.request.get("/api/library")).json()).places,
  ).toEqual(before);
  await fits(page);
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  expect(
    (await (await page.request.get("/api/library")).json()).places,
  ).toEqual(before);
});

test("map searches candidates, allows manual pin, and location is temporary with permission only on request", async ({
  page,
  context,
}) => {
  let calls = 0;
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition(success: (v: unknown) => void) {
          (window as unknown as { geoCalls: number }).geoCalls =
            ((window as unknown as { geoCalls: number }).geoCalls || 0) + 1;
          success({
            coords: { latitude: -34.6, longitude: -58.38, accuracy: 20 },
          });
        },
      },
    });
  });
  await login(page);
  const placesBefore = (await (await page.request.get("/api/library")).json())
    .places;
  expect(
    await page.evaluate(
      () => (window as unknown as { geoCalls: number }).geoCalls || 0,
    ),
  ).toBe(0);
  await page.getByRole("button", { name: "Mi ubicación", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "temporal y no se guarda",
  );
  expect(
    (await (await page.request.get("/api/library")).json()).places,
  ).toEqual(placesBefore);
  await page.route("**/api/places/resolve", async (route) => {
    calls++;
    await route.fulfill({
      json: {
        results: [
          {
            name: "Café de ejemplo",
            address: "Corrientes100, Buenos Aires",
            lat: -34.603,
            lng: -58.38,
          },
        ],
      },
    });
  });
  await page
    .getByRole("button", { name: "Agregar lugar", exact: true })
    .click();
  await page
    .getByLabel("Dirección o enlace de Google Maps")
    .fill("Corrientes100 Buenos Aires");
  expect(calls).toBe(0);
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await page
    .getByRole("button", { name: /Café de ejemplo Corrientes/ })
    .click();
  await expect(
    page.getByLabel("Nombre del lugar", { exact: true }),
  ).toHaveValue("Café de ejemplo");
  await page
    .getByRole("region", { name: "Mapa de nuestros lugares" })
    .click({ position: { x: 100, y: 100 } });
  await expect(page.locator(".place-fields")).toContainText("Punto a guardar:");
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  expect(
    (await (await page.request.get("/api/library")).json()).places,
  ).toEqual(placesBefore);
  await page.evaluate(() =>
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition(_success: unknown, failure: (v: unknown) => void) {
          failure({ code: 1 });
        },
      },
    }),
  );
  await page.getByRole("button", { name: "Mi ubicación", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("No se permitió");
  await page
    .getByRole("button", { name: "Agregar lugar", exact: true })
    .click();
  await page
    .getByLabel("Dirección o enlace de Google Maps")
    .fill("Una dirección sin resultados");
  await page.route("**/api/places/resolve", (route) =>
    route.fulfill({ json: { results: [] } }),
  );
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(page.locator(".place-editor")).toContainText(
    "No encontramos resultados",
  );
  await page.route("**/api/places/resolve", (route) =>
    route.fulfill({
      status: 502,
      json: { error: "Búsqueda temporalmente no disponible" },
    }),
  );
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "temporalmente no disponible",
  );
  await expect(
    page.getByLabel("Dirección o enlace de Google Maps"),
  ).toHaveValue("Una dirección sin resultados");
  await fits(page);
});
