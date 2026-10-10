# Tasks: Álbumes personalizables
## Phase 1: Setup
- [x] T001 Crear spec, plan, modelo, contratos y checklist en specs/011-album-customization/; main sincronizado.
- [x] T002 Respaldar library, originales y DB actuales en backups/pre-album-edit-2026-10-09/.
## Phase 2: Foundation
- [x] T003 Cubrir persistencia, privacidad, inválidos y preservación en tests/albums.test.ts antes de implementar endpoint.
- [x] T004 Añadir AlbumCustomization y resolución de nombres/portada en shared/{types,albums}.ts; title trimmed no vacío máximo80, coverId UUID o null.
## Phase 3: User Story 1
- [x] T005 [US1] Añadir API privada PATCH /api/albums y Library.albums en server/app.ts usando meta existente, sin UPDATE histórico; rechazar colisión de título con otra clave/título.
- [x] T006 [US1] Mostrar títulos coherentes en src/components/{Revisit,Gallery,Viewer,UploadDialog}.tsx y resolver selección de subida/edición a clave estable; integrar src/App.tsx.
## Phase 4: User Story 2
- [x] T007 [US2] Crear src/components/AlbumDialog.tsx con nombre, radio de fotos/automática, preview, error y cancelación; controles44px y src/styles.css responsive.
- [x] T008 [US2] Elegir portada en src/components/Revisit.tsx, fallback si fuera del álbum, y exportar albums en src/backup.ts.
## Phase 5: Delivery
- [x] T009 Verificar edición, recarga, nueva subida al mismo grupo, fallback y ZIP en tests/{albums,e2e,backup-browser}.test/spec.ts; build y suites.
- [x] T010 Commit/push, CI, publicar Render y verificar UI sintética y contenido histórico contra respaldo; evidencia en specs/011-album-customization/verification.md.
## Dependencies
T001 → T002/T003 → T004 → T005 → T006/T007 → T008 → T009 → T010. US1 y US2 comparten editor; deben publicarse juntas.
## Parallel opportunities
Investigación read-only y respaldo independientes del diseño; ediciones compartidas secuenciales. No trabajo paralelo de código necesario.
## Implementation strategy
Diseño primero, prueba crítica antes del endpoint, implementación completa mobile/PC y publicación tras CI; no mutar álbumes personales para probar.
