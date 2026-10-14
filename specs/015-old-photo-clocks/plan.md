# Plan: Horas de fotos anteriores
**Date**: 2026-10-14 | **Spec**: [spec.md](./spec.md) | **Branch**: main
## Summary
Herramienta operativa con scan/apply, API privada fija del sitio para originales y PostgreSQL privado para INSERT-only. Reusar readPhotoClock/validCapturedAt. Sin nuevo endpoint ni despliegue: el lector/orden de014 ya usa photo-clock.
## Technical Context
TypeScript/Node22+, pg8, Sharp/exifr fijados existentes. Scripts/backfill-photo-clocks.ts, server/backfill-photo-clocks.ts y tests/backfill-photo-clocks.test.ts. Snapshots/propuestas/copias/digests privados bajo backups, ignorados por Git. API sólo GEToriginales y sesión existente; ninguna escritura Storage. Descarga secuencial, acotada por tamaño y MIME; reloj opcional no ocupa cuota de archivos.
## Constitution Check
PASS: sesión privada, secretos fuera del repo, persistencia y respaldo; especificaciones previas; pruebas PGlite/descarga/conservación y lectura de orden existente; cero cambios de calidad/pago/privilegios. No red dentro de transacción.
## Structure and design
Scan: filas raw + claves existentes → originales privados/hash/tipo/tamaño → propuesta capturada usando EXIF real. Apply: conexión pg dedicada, transacción repeatable-read, SELECT foto FOR UPDATE, comparar toda fila contra propuesta, INSERT meta ON CONFLICT DO NOTHING RETURNING. Comparar media/notes/meta previos antes de COMMIT; rollback ante diferencia o error. Nueva clave sólo photo-clock:id validado, sin UPDATE/DELETE ni modificación de archivos.
## Complexity
Sin DDL. No reutilizar photoClocks.save porque hace upsert. No usar BEGIN con el adapter de pool por consultas sin afinidad; cliente conectado único para toda transacción.
