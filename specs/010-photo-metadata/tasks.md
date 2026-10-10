# Tasks: Fechas automáticas
## Phase 1: Setup
- [x] T001 Guardar main y tag de recuperación en Git; definir spec y checklist en specs/010-photo-metadata/.
- [ ] T002 Verificar respaldo completo privado de originales y library en backups/pre-photo-metadata-2026-10-09/.
## Phase 2: Foundation
- [ ] T003 Cubrir validación de calendario, zona y preservación histórica en tests/metadata.test.ts y tests/api.test.ts.
- [ ] T004 Añadir campos opcionales y funciones temporales compartidas en shared/types.ts y shared/media-time.ts.
## Phase 3: User Story 1
- [ ] T005 [US1] Leer fechas selectivamente del original en src/photo-metadata.ts; capturedAt formato calendario real YYYY-MM-DDTHH:mm:ss, captureOffset ±HH:mm máximo ±14:00.
- [ ] T006 [US1] Conservar metadataRead y fechas por ítem antes de conversión/reanudación en src/upload-queue.ts y src/components/UploadDialog.tsx; quitar fecha manual al subir.
- [ ] T007 [US1] Añadir almacenamiento nullable, dateSource metadata/upload/manual y carga compatible en server/{db,database,app}.ts y supabase/{schema,photo-metadata}.sql, sin UPDATE histórico.
## Phase 4: User Story 2
- [ ] T008 [US2] Añadir referencia y cinco filtros, limpieza y orden por minuto en src/components/Gallery.tsx y src/styles.css.
- [ ] T009 [US2] Mostrar fecha/hora y procedencia y preservar edición de títulos en src/components/{Gallery,Viewer}.tsx.
- [ ] T010 [US2] Verificar carga automática y filtros combinados en móvil/escritorio en tests/e2e.spec.ts.
## Phase 5: User Story 3
- [ ] T011 [US3] Verificar repetición no destructiva de ampliación SQLite/PostgreSQL y datos anteriores en tests/metadata.test.ts.
- [ ] T012 [US3] Aplicar ALTER remoto sólo después de respaldo y checks; comparar datos y archivos en backups/.
## Phase 6: Delivery
- [ ] T013 Compilar, ejecutar tests y CI, commit/push y publicar en Render; registrar evidencia en specs/010-photo-metadata/verification.md.

## Dependencies
T001 → T002 → foundation → US1 → US2 → US3 → delivery. Pruebas críticas antes de implementación. US3 verifica preservación independientemente de filtros.
## Parallel opportunities
Investigación exifr y revisión de diseño no escriben archivos; pruebas temporales y lectura de fuentes independientes. Ediciones compartidas y migraciones secuenciales.
## Strategy
Incrementos con commit/push: diseño y respaldo; lectura/persistencia validada; filtros/navegador; publicación verificada. Sin esperar agotamiento de cuota.
