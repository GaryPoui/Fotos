# Tasks: Galerías, línea de tiempo y carrusel
**Input**: spec.md, plan.md, research.md, data-model.md, contracts/
**Tests**: Contratos sensibles y recorridos definidos en spec.md.
## Phase 1: Setup
- [ ] T001 Revisar requisitos en specs/003-memory-views/spec.md y plan.md
## Phase 2: User Story 1 (P1)
**Goal**: Volver a vivir nuestros momentos.
**Independent test**: Alternar mosaico, línea de tiempo y carrusel; avanzar con toque/teclado y pausar.
- [ ] T002 [US1] Implementar mosaico y línea de tiempo en src/components/Gallery.tsx
- [ ] T003 [US1] Implementar visor y carrusel con teclado/toque en src/components/Viewer.tsx
- [ ] T004 [US1] Implementar pausa, temporizador y movimiento reducido en src/components/Viewer.tsx y src/styles.css
- [ ] T005 [US1] Verificar recorridos y vista de 390 px en tests/e2e.spec.ts y docs/verification.md
## Dependencies & Execution Order
T001 primero; tareas en orden. 001 → 002 → 003; 004/005 dependen de 001/002; 006 cierra integración.
## Parallel opportunities
Lectura y revisión independientes; archivos compartidos secuenciales.
## Implementation Strategy
Entregas incrementales con validación, commit/push y converge.
