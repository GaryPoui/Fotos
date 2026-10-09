# Tasks: Publicación gratuita
**Input**: spec.md, plan.md, research.md, data-model.md, contracts/api.md.

## Phase 1: Setup
- [X] T001 Crear especificación y diseño en specs/007-free-hosting/; verificar límites oficiales.
## Phase 2: Foundational
- [X] T002 Ampliar principio de persistencia remota en .specify/memory/constitution.md y agregar pg en package.json.
## Phase 3: US1 - Persistencia online
**Independent test**: reconstruir servidor con staging vacío conservando cartas, sesiones y objetos privados.
- [X] T003 [US1] Implementar SQL asíncrono en server/database.ts y esquema privado en supabase/schema.sql; conservar createdAt y expires bigint.
- [X] T004 [US1] Implementar bucket privado y proxy Range en server/cloud-storage.ts; errores sin claves.
- [X] T005 [US1] Integrar persistencia, limpieza, sesiones y subidas serializadas en server/app.ts y server/index.ts.
- [X] T006 [US1] Verificar persistencia, privacidad, rangos, fallos y concurrencia con PostgreSQL embebido en tests/cloud.test.ts.
## Phase 4: US2 - Presupuesto cero
**Independent test**: confirmar plan Free sin disco y rechazo al superar cupos.
- [X] T007 [US2] Configurar render.yaml y .env.example con archivo <= 50.000.000 bytes y suma storedBytes <= 900.000.000 bytes; fallar con configuración incompleta.
- [X] T008 [US2] Documentar configuración gratuita, pausas, respaldo remoto y publicación en docs/free-hosting.md y docs/hosting.md.
- [ ] T009 [US2] Publicar con cuentas del usuario y verificar URL HTTPS, persistencia, privacidad y plan gratuito; registrar evidencia en docs/verification.md.
## Phase 5: Polish
- [ ] T010 Ejecutar build, integración y navegador; registrar resultado en docs/verification.md; commit y push por avance.

## Dependencies & Execution Order
T001 → T002 → T003/T004 → T005 → T006 → T007/T008 → T009/T010. T009 requiere cuentas del usuario.
## Parallel opportunities
Investigación de proveedores independiente; implementación secuencial para evitar conflictos de archivos.
## Implementation Strategy
Primero modalidad remota compatible, luego verificación local y finalmente publicación gratuita con cuentas reales. No afirmar publicación antes de comprobar dirección pública.
