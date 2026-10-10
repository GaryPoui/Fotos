# Tasks: Nuestro mapa
## Phase 1: Setup
- [x] T001 Definir spec, plan, research, data-model, contracts, quickstart y checklist en specs/012-places-map/ con Spec Kit.
- [x] T002 Guardar snapshot privado fresco de DB/library en backups/pre-map-2026-10-10/; commit/push diseño.
## Phase 2: Foundation
- [ ] T003 Cubrir URLs/SSRF, resultados/caché/errores y CRUD privado/persistencia/preservación en tests/places.test.ts antes del backend.
- [ ] T004 Añadir Place, Candidate y categorías en shared/{types,places}.ts; name trimmed1–100,address0–400,note0–1000,lat[-90,90],lng[-180,180],category enum cafe|restaurant|shopping|visit|important|park|other,idUUID,timestampsISOserver.
- [ ] T005 Instalar leaflet1.9.4 y tipos fijados en package{,-lock}.json; conservar despliegue y privacidad.
## Phase 3: US1 Guardar
- [ ] T006 [US1] Implementar búsqueda/maps resolver allowlist HTTPS/manual redirects5/timeout/caché256/throttle1s y Photon en server/places.ts, sin logs de consultas privadas ni HTML scraping.
- [ ] T007 [US1] Integrar CRUD y resolve privados en server/app.ts y Library.places con meta place:UUID, sin escribir media/notes/album/settings; exportar places en src/backup.ts y verificar ZIP en tests/backup-browser.test.ts.
- [ ] T008 [US1] Implementar editor de lugar/búsqueda/resultados/preview/manualpin/save/cancel/error en src/components/PlacesMap.tsx; borrador retenido en fallo.
## Phase 4: US2 Recorrer
- [ ] T009 [US2] Crear src/components/PlaceCanvas.tsx con mapa Leaflet/tileattribution, markers seguros por categoría, selección, fitall, zoom y falla tiles; cargar lazy desde src/App.tsx con nav Mapa.
- [ ] T010 [US2] Añadir lista/filtro/detalle/edit/deleteconfirm/Mapslink y responsive44/reduced-motion a src/components/PlacesMap.tsx y src/styles.css, sin cambiar otros recorridos.
## Phase 5: US3 Ubicación
- [ ] T011 [US3] Añadir Mi ubicación client-only, permiso sólo por botón, accuracy/centering, rechazo/error recuperable y cleanup en src/components/{PlacesMap,PlaceCanvas}.tsx.
## Phase 6: Delivery
- [ ] T012 Verificar PostgreSQL adapter, reinicio/preservación en tests/cloud.test.ts, navegador a360/390/1440 con lookup/tiles/geolocalización fixtures y retries en tests/places.e2e.spec.ts, build y suites completas.
- [ ] T013 Commit/push, CI, publicar Render, proveedor real con consulta pública, QA público sintético sin guardar lugares reales, comparación históricos y evidencia en specs/012-places-map/verification.md.
## Dependencies
T001→T002→T003/T004/T005→T006→T007→T008/T009→T010/T011→T012→T013. US2 requiere lugares de US1; US3 mapa de US2.
## Parallel opportunities
Investigación read-only separada del diseño ejecutada por skill plan; tests/API/estilos compartidos se trabajan secuencialmente.
## Implementation strategy
Completar tres historias antes de publicación; tests de riesgo antes de backend; datos sintéticos aislados; cambios de UI verificados sin mutar contenido personal.
