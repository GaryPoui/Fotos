# Tasks: Videos grandes y espacio disponible
## Phase 1 Setup
- [x] T001 Generar spec/plan/research/data-model/contracts/quickstart/checklist mediante Spec Kit en specs/013-large-video-storage/ y resolver investigación primaria.
- [x] T002 Guardar snapshot privado de DB/library en backups/pre-large-video-2026-10-13/ y registrar diseño con commit/push.
## Phase 2 Foundation
- [x] T003 Cubrir descriptor/keys/rangos/stream/errores en tests/segmented-storage.test.ts antes del backend.
- [x] T004 Implementar codec, límites y streaming/remoción/put segmentados en server/video-parts.ts, server/cloud-storage.ts y shared/storage.ts, sin cambiar bridge ni archivos anteriores.
## Phase 3 US1 Videos
- [x] T005 [US1] Añadir journal/reservas/recuperación segura, validación por tipo y cuota en server/video-uploads.ts/server/app.ts; timeout razonable en server/index.ts/src/lib.ts; mantener producción50M hasta baseline.
- [x] T006 [US1] Verificar >50M MP4 real sintético, SHA, Range, fallos/cleanup/reservas/reinicio/idempotencia/legacy con PGlite en tests/cloud.test.ts y descarga de copia.
## Phase 4 US2 Espacio
- [x] T007 [US2] Campos API compatibles en shared/types.ts y Library, indicador StorageSummary, props/validación y espacio en UploadDialog, integración App/styles, sin explicar implementación interna en flujos.
- [x] T008 [US2] Verificar browser360/390/1440, límite por tipo, espacio/errores/actualización y demás recorridos en tests/e2e.spec.ts, build y suites completas.
## Phase 5 Delivery
- [x] T009 Commit/push/CI y publicar lector compatible en Render todavía50M; guardar baseline para rollback seguro; probar proveedor real con artefactos sintéticos propios verificando bytes y retirada exacta.
- [x] T010 Habilitar200MiB en server/index.ts, commit/push/checks y publicar Render; QA público/capacidad/video>50M conservando contenido personal.
- [x] T011 Comparar históricos/schema/espacio tras limpiar sólo pruebas propias; evidencia/screenshots en verification.md, marcar tareas y commit/push final.
## Dependencies
T001→T002→T003→T004→T005→T006→T007→T008→T009→T010→T011. US2 usa reservas de US1; flags sólo después del lector validado.
## Parallel opportunities
Investigación read-only despachada por skill plan; pruebas/lectura independientes concurrentes con tools, cambios en archivos compartidos secuenciales.
## Strategy
Privacidad/persistencia primero; preservar legacy, probar partes/rangos sin pérdida, publicar baseline lector antes de nuevos formatos, habilitar límite y verificar el sitio real.
