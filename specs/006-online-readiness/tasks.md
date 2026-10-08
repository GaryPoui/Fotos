# Tasks: Hosting, respaldo y verificación
**Input**: spec.md, plan.md, research.md, data-model.md, contracts/
**Tests**: Contratos sensibles y recorridos definidos en spec.md.
## Phase 1: Setup
- [X] T001 Revisar requisitos en specs/006-online-readiness/spec.md y plan.md
## Phase 2: User Story 1 (P1)
**Goal**: Poder abrir nuestro rincón online sin perder recuerdos.
**Independent test**: Compilar, arrancar producción, comprobar health, reiniciar preservando datos y restaurar respaldo.
- [X] T002 [US1] Crear Dockerfile, compose.yaml, .env.example y .dockerignore
- [X] T003 [US1] Implementar respaldo consistente en scripts/backup.ts y documentar restauración en docs/hosting.md
- [X] T004 [US1] Configurar CI con typecheck, API y navegador en .github/workflows/ci.yml
- [X] T005 [US1] Validar producción, reinicio, backup y mobile first; registrar resultado en docs/verification.md
- [X] T006 [US1] Actualizar README.md con inicio rápido, specs, hosting y límites reales
## Dependencies & Execution Order
T001 primero; tareas en orden. 001 → 002 → 003; 004/005 dependen de 001/002; 006 cierra integración.
## Parallel opportunities
Lectura y revisión independientes; archivos compartidos secuenciales.
## Implementation Strategy
Entregas incrementales con validación, commit/push y converge.


## Phase 3: Convergence
- [ ] T007 [US1] CRITICAL Corregir bloqueo obsoleto con PID reutilizado en server/lifecycle.ts y verificar reemplazo de contenedor conservando volumen en .github/workflows/ci.yml, por FR-001 y prueba independiente de reinicio (partial).
