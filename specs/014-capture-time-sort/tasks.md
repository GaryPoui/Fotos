# Tasks: Orden por hora de toma
## Phase 1 Setup
- [x] T001 Resolver aclaración, investigación, spec/plan/contracts/checklist y snapshot privado en specs/014-capture-time-sort/ y backups/pre-capture-time-2026-10-13/; guardar punto de recuperación Git.
## Phase 2 Foundation
- [x] T002 Añadir pruebas previas de parser/comparador/segundos/fallback en tests/photo-clock.test.ts; instalar exifr fijado; implementar shared/photo-clock.ts/shared/photo-metadata.ts y server/photo-clock.ts.
## Phase 3 US1 Orden automático
- [x] T003 Integrar meta opcional/servidor/prioridad EXIF y candidato validado, listado compartido e idempotencia/limpieza segura en server/app.ts/shared/types.ts; pruebas SQLite/PGlite/originales intactos.
- [x] T004 Capturar antes de conversión y guardar en borrador; props/campos de subida internos en src/upload-queue.ts/src/components/UploadDialog.tsx. Verificar HEIC/reintento sin campos manuales de hora.
- [x] T005 Usar comparator en Gallery/moments y mostrar HH:mm:ss en Viewer, helper explicativo de orden sin hora manual. Verificar todos los modos/asc/desc en tests/e2e.spec.ts.
## Phase 4 US2 Conservación
- [x] T006 Build, suites completas y responsive360/390/1440; casos sin EXIF, timestamps imposibles, zona, fallos y fecha manual intacta.
## Phase 5 US3 Espacio y entrega
- [x] T007 Documentar recomendación con uso actual agregado y fuentes primarias, sin comprimir/migrar ni activar facturación.
- [ ] T008 Commit/push/checks, publicar Render, probar nuevo orden con fotos sintéticas propias y remover sólo esos IDs; verificar históricos/schema y screenshots, completar verification.md y push final.
## Dependencies
T001→T002→T003→T004→T005→T006→T007→T008. US2 protege cada paso; US3 puede investigarse en paralelo sin mutaciones.
## Parallel opportunities
Investigación read-only por agente según skill plan; lecturas/tests independientes concurrentes con tools. Ediciones compartidas y publicación secuenciales.
## Strategy
Hora opcional nueva sin tocar fecha ni original anterior; parser/comparador probados antes de integrarse; publicación sólo tras pruebas y verificación de conservación.
