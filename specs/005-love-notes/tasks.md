# Tasks: Frases y cartas
**Input**: spec.md, plan.md, research.md, data-model.md, contracts/
**Tests**: Contratos sensibles y recorridos definidos en spec.md.
## Phase 1: Setup
- [X] T001 Revisar requisitos en specs/005-love-notes/spec.md y plan.md
## Phase 2: User Story 1 (P1)
**Goal**: Dejarnos palabras para volver a leer.
**Independent test**: Crear una frase y una carta, leerlas completas, editar, marcar favorita y recargar.
- [X] T002 [US1] Escribir pruebas de validación, privacidad y CRUD de escritos en tests/api.test.ts
- [X] T003 [US1] Implementar contratos y persistencia de escritos en server/app.ts y server/db.ts
- [X] T004 [US1] Implementar lectura, búsqueda, favoritos y editor en src/components/Notes.tsx y src/components/NoteDialog.tsx
- [X] T005 [US1] Verificar creación/edición/lectura después de recarga en tests/e2e.spec.ts
## Dependencies & Execution Order
T001 primero; tareas en orden. 001 → 002 → 003; 004/005 dependen de 001/002; 006 cierra integración.
## Parallel opportunities
Lectura y revisión independientes; archivos compartidos secuenciales.
## Implementation Strategy
Entregas incrementales con validación, commit/push y converge.
