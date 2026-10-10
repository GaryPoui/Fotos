# Research — 2026-10-10
## Follow-up: enlaces y diseño
Photon documenta `/reverse?lat=...&lon=...&radius=...`; se limita a 0.1 km para evitar adjudicar direcciones lejanas. El candidato conserva coordenadas de Maps, aunque el resultado reverse sea cercano; la dirección se presenta como sugerencia para revisar. Reverse sin calle o caída del proveedor no elimina el punto ni reemplaza datos guardados. [API reverse](https://github.com/komoot/photon/blob/master/docs/api-v1.md#reverse).
Se conserva OSM, estilizando exclusivamente su capa de tiles y mejorando el marco y los controles. CARTO ahora documenta clave incluso para su servicio gratuito; no se agrega esa dependencia para un cambio estético. [Basemaps actuales](https://carto.com/basemaps/index.html).

Research agent dispatched by speckit-plan reviewed primary sources and current library/policy details.

## Map and search
**Decision**: Leaflet1.9.4 with browser-cached OSM raster tiles, attribution, maxzoom19; lazy loaded page. Explicit manual address search via authenticated Photon proxy, cache and conservative local1request/s throttle, timeout and configurable endpoint. No autocomplete, bulk lookup, prefetch or offline download.
**Rationale**: Small app for two people, no credentials or billing. Photon permits reasonable use but has no availability guarantee; map-point selection and saved list remain alternatives.
**Alternatives**: Google Maps JS requires billing/API configuration; public Nominatim imposes additional integration restrictions. No new accounts needed.
Sources: [Leaflet stable](https://leafletjs.com/download.html), [OSM tiles policy](https://operations.osmfoundation.org/policies/tiles/), [Photon terms](https://photon.komoot.io/), [Photon API](https://github.com/komoot/photon/blob/master/docs/api-v1.md).

## Maps URLs and privacy
**Decision**: Parse query/q coordinates, place-data !3d/!4d before camera center, or geocode place/address text. Shortlinks use HTTPS manual redirect max5, exact allowlisted Google hosts and Maps paths, no credentials/custom ports, timeouts and no HTML scraping. Reject routes with multiple stops and arbitrary URLs. Camera-only points explicitly approximate; always preview before save.
**Rationale**: Official Maps URLs support coordinates without a key; shared opaque IDs cannot always be resolved without a paid Places API. Heuristic data patterns are not an official Google contract; correction must remain available.
**Alternatives**: Fetching arbitrary links risks SSRF; HTML scraping is brittle. Provider failure must not lose draft.
Sources: [Google Maps URLs](https://developers.google.com/maps/documentation/urls/get-started), [SSRF guidance](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html), [Geolocation](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition).
Current position stays client-only and is requested by button, never sent as search bias. Search sends only explicit address/query, never notes/category/name fields. Map tiles reveal viewed region to tile provider as normal map operation.

## Persistence
**Decision**: Reuse private rincon.meta with one place:<UUID> JSON per saved place; no migrations, DDL, role changes or writes to media/notes/albums/settings. Library.places optional for backward compatibility; ZIP includes places.
**Rationale**: Existing SQLite/PostgreSQL adapter supports independent atomic rows and existing dedicated role DML. Avoid schema changes entirely. Auth+CSRF inherited.
Supabase skill consulted; current changelog has no relevant pg-connection break. Existing pg TLS/session pool remains unchanged. [Connections docs](https://supabase.com/docs/guides/database/connecting-to-postgres).
