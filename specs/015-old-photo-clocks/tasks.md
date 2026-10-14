# Tasks: Horas de fotos anteriores
- [x] T001 Resolver research/spec/plan/model/contracts/checklist y snapshot privado en backups/pre-old-photo-clock-2026-10-14/; guardar diseño en Git.
- [ ] T002 Escribir pruebas de descarga/insert-only/concurrencia/rollback/idempotencia en tests/backfill-photo-clocks.test.ts antes de implementar.
- [ ] T003 Implementar server/backfill-photo-clocks.ts y scripts/backfill-photo-clocks.ts con scan/apply privados, cliente pg dedicado y validación; package script sin nuevas dependencias.
- [ ] T004 Tests/build; scan sólo lectura, revisar propuesta y aplicar únicamente horas válidas faltantes.
- [ ] T005 Verificar filas/schema/claves/uso/orden web, evidencia privada y verification.md, commits/push finales.
## Dependencies and strategy
T001→T002→T003→T004→T005. Research read-only por skill plan; datos propios secuenciales. Reusar UI014 existente, no despliegue ni backfill automático en startup.
