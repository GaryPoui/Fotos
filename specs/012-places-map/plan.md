# Implementation Plan: Nuestro mapa
**Branch**: main | **Date**: 2026-10-10 | **Spec**: [spec.md](spec.md)
## Summary
Nueva página lazy Mapa con Leaflet y OSM, lugares privados persistidos en filas meta independientes, proxy Photon autenticado para dirección o Maps URL, preview/corrección manual, categorías con lucide icons, filtros, edición y eliminación confirmada. Geolocalización por acción explícita, sólo memoria del cliente.
## Technical Context
TypeScript/React19/Express5/Node24 existentes; Leaflet1.9.4 + tipos fijados. SQLite local, PostgreSQL privado rincon.meta remoto existente, sin cambios de esquema ni permisos. Vitest/Supertest/PGlite y Playwright móvil/PC. Dos personas, cientos de lugares; búsqueda manual <=1request/s propia, caché bounded256, timeout10s, sin precarga tiles. Fuente de tiles configurada build-time (default OSM) y origen CSP correspondiente, buscador configurable server-side sin exponer secretos.
## Constitution Check
PASS antes/después del diseño: sesión/CSRF y SSRF allowlist; escrituras limitadas a place:UUID; respaldo y comparación históricos; spec antes de código; integración privacidad/persistencia + navegador/geolocalización; mobile360px, controles44, teclado/reduced-motion, paleta existente; sin servicios de pago. No se necesita migración, DDL ni nueva autorización de servicios. No tracking.
## Project Structure
shared/{types,places}.ts; server/{app,places}.ts; src/{App,styles,backup}; src/components/{PlacesMap,PlaceCanvas}.tsx; tests/{places.test.ts,cloud.test.ts,backup-browser.test.ts,places.e2e.spec.ts}; specs/012-places-map/{spec,plan,research,data-model,tasks,quickstart,verification}.md y contracts/places.md.
**Structure Decision**: Ampliar web y adapter actuales con módulo autónomo; esconder nueva página en alternativa Firebase no desplegada.
## Follow-up del 2026-10-10
Resolver coordenadas de URL con Photon /reverse (lat/lon, radio máximo 100 m), preservar siempre el punto exacto de Maps y su nombre si está incluido; dirección cercana revisable y señal de aproximación. Si falla el proveedor, conservar punto utilizable sin inventar dirección. URLs cortas mantienen la allowlist y máximo cinco redirecciones; sin scraping. Caché y cooldown compartidos con búsquedas.
Cliente: debounce 650 ms sólo para enlaces HTTPS de Maps, una resolución por texto; un resultado precarga campos y marcador, ambiguos permanecen a elegir. Generaciones y revisiones de campo impiden sobrescribir correcciones recientes. Guardado explícito. Diseño con marco blanco, barra integrada, mapa pastel y pines circulares por categoría; sólo la capa de tiles recibe el filtro visual, texto de la interfaz y marcadores conservan contraste. No cambio de almacenamiento ni actualización masiva de lugares existentes.

## Delivery
Registrar diseño y tareas; snapshot DB/library privado fresco; tests críticos de servicio/API; código; build y suites; commit/push, CI, Render y QA público sintético con guardados interceptados; comparar datos históricos. Documentar límites de links opacos y servicios sin SLA. No modificar lugares o recuerdos reales para probar.

