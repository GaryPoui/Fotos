# Tasks: Nuestra música
**Input**: spec.md, plan.md, research.md, data-model.md, contracts/
**Tests**: Contratos sensibles y recorridos definidos en spec.md.
## Phase 1: Setup
- [X] T001 Revisar requisitos en specs/004-soundtrack/spec.md y plan.md
## Phase 2: User Story 1 (P1)
**Goal**: Escuchar nuestras canciones mientras vemos recuerdos.
**Independent test**: Subir un audio, reproducirlo, navegar a cartas, pausar, cambiar pista y volumen.
- [X] T002 [US1] Añadir pruebas de audio privado y validación a tests/api.test.ts
- [X] T003 [US1] Implementar biblioteca y carga de canciones en src/components/Music.tsx
- [X] T004 [US1] Implementar reproductor persistente con seek/volumen y controles en src/components/Player.tsx
- [X] T005 [US1] Verificar navegación con reproducción y errores en tests/e2e.spec.ts y docs/verification.md
## Dependencies & Execution Order
T001 primero; tareas en orden. 001 → 002 → 003; 004/005 dependen de 001/002; 006 cierra integración.
## Parallel opportunities
Lectura y revisión independientes; archivos compartidos secuenciales.
## Implementation Strategy
Entregas incrementales con validación, commit/push y converge.

