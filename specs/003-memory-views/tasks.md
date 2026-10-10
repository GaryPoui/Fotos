# Tasks: Galerías, línea de tiempo y carrusel
**Input**: spec.md, plan.md, research.md, data-model.md, contracts/
**Tests**: Contratos sensibles y recorridos definidos en spec.md.
## Phase 1: Setup
- [X] T001 Revisar requisitos en specs/003-memory-views/spec.md y plan.md
## Phase 2: User Story 1 (P1)
**Goal**: Volver a vivir nuestros momentos.
**Independent test**: Alternar mosaico, línea de tiempo y carrusel; avanzar con toque/teclado y pausar.
- [X] T002 [US1] Implementar mosaico y línea de tiempo en src/components/Gallery.tsx
- [X] T003 [US1] Implementar visor y carrusel con teclado/toque en src/components/Viewer.tsx
- [X] T004 [US1] Implementar pausa, temporizador y movimiento reducido en src/components/Viewer.tsx y src/styles.css
- [X] T005 [US1] Verificar recorridos y vista de 390 px en tests/e2e.spec.ts y docs/verification.md
- [X] T006 [US1] Implementar escenario con profundidad, transición y selección lateral en src/components/Coverflow.tsx y src/styles.css; integrar en Viewer.tsx conservando visor completo, pausa de video y gestos accesibles.
- [X] T007 [US1] Verificar vuelta circular, pocos recuerdos, teclado, toque, video, movimiento reducido y diseño móvil/escritorio; registrar evidencia, build, commit y push; publicar en Render Free.
- [X] T008 [US1] Iniciar carrusel automáticamente cada 7 segundos en Viewer.tsx, verificar avance y pausa en navegador, compilar y publicar en Render.
## Dependencies & Execution Order
T001 primero; tareas en orden. 001 → 002 → 003; 004/005 dependen de 001/002; 006 cierra integración.
## Parallel opportunities
Lectura y revisión independientes; archivos compartidos secuenciales.
## Implementation Strategy
Entregas incrementales con validación, commit/push y converge.

## Responsive y álbumes
- [X] T009 [US1] Reproducir y corregir expansión de álbumes, portada y visor; añadir flechas de recorrido accesibles móvil/escritorio.
- [ ] T010 [US1] Verificar biblioteca grande, tamaños móviles/escritorio, selección, modal, reduced motion; compilar, publicar y registrar evidencia.
