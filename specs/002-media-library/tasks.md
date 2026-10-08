# Tasks: Fotos, videos y organización
**Input**: spec.md, plan.md, research.md, data-model.md, contracts/
**Tests**: Contratos sensibles y recorridos definidos en spec.md.
## Phase 1: Setup
- [X] T001 Revisar requisitos en specs/002-media-library/spec.md y plan.md
## Phase 2: User Story 1 (P1)
**Goal**: Guardar nuestros recuerdos y encontrarlos.
**Independent test**: Subir una foto y un video, asignar fecha/álbum/etiquetas, filtrar y recargar.
- [X] T002 [US1] Escribir pruebas de subida privada, validación, filtro y persistencia en tests/api.test.ts
- [X] T003 [US1] Implementar almacenamiento temporal, detección y limpieza en server/files.ts
- [X] T004 [US1] Implementar CRUD de media en server/app.ts y server/db.ts
- [X] T005 [US1] Implementar formulario, progreso, filtros y edición en src/components/UploadDialog.tsx y src/components/Gallery.tsx
- [X] T006 [US1] Verificar subida/edición/eliminación y persistencia con tests/api.test.ts y tests/e2e.spec.ts
## Dependencies & Execution Order
T001 primero; tareas en orden. 001 → 002 → 003; 004/005 dependen de 001/002; 006 cierra integración.
## Parallel opportunities
Lectura y revisión independientes; archivos compartidos secuenciales.
## Implementation Strategy
Entregas incrementales con validación, commit/push y converge.
