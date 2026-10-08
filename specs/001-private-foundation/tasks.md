# Tasks: Base privada y diseño mobile first
**Input**: spec.md, plan.md, research.md, data-model.md, contracts/
**Tests**: Contratos sensibles y recorridos definidos en spec.md.
## Phase 1: Setup
- [X] T001 Revisar requisitos en specs/001-private-foundation/spec.md y plan.md
## Phase 2: User Story 1 (P1)
**Goal**: Entrar a nuestro espacio desde el celular.
**Independent test**: Abrir a 390 px, autenticar, recargar y cerrar sesión.
- [X] T002 [US1] Configurar TypeScript, React, Vite y scripts en package.json y vite.config.ts
- [X] T003 [US1] Escribir pruebas de acceso privado, sesión y origen en tests/api.test.ts
- [X] T004 [US1] Implementar SQLite, sesiones y autenticación en server/db.ts y server/app.ts
- [X] T005 [US1] Implementar acceso y navegación mobile first celeste/rosado en src/App.tsx y src/styles.css
- [X] T006 [US1] Verificar types, integración y compilación; registrar evidencia en docs/verification.md
## Dependencies & Execution Order
T001 primero; tareas en orden. 001 → 002 → 003; 004/005 dependen de 001/002; 006 cierra integración.
## Parallel opportunities
Lectura y revisión independientes; archivos compartidos secuenciales.
## Implementation Strategy
Entregas incrementales con validación, commit/push y converge.

## Personalización del acceso
- [X] T007 [US1] Agregar las tres pistas de acceso, instrucciones de escritura y nombres Ailu/Tomy en la interfaz; actualizar contraseña local fuera de Git y nombres guardados. Verificado acceso real, pistas visibles y ausencia de desbordamiento a 360 px, además de compilación y tipos.
