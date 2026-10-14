# Validation
1. Snapshot privado y commit previo.
2. Vitest PGlite: día/campos/notes/meta conservados, reloj existente/malformado intacto, fila cambiada/eliminada omitida, rollback e idempotencia; descarga parcial/incorrecta/truncada/sobrante rechazada.
3. Build; scan sólo lectura, informar conteos. Apply sólo propuesta verificada después de tests.
4. Comparar schema/filas previas y nuevas claves esperadas, uso sin cambios, API ordenada; captura del indicador horario sin imágenes/títulos privados. Commit/push de fuente/docs; resultados/copias fuera de Git.
En PowerShell con el shim npm que consume flags, usar directamente `node --import tsx scripts/backfill-photo-clocks.ts --mode scan|apply --snapshot backups/pre-old-photo-clock-2026-10-14 --env .env.render`.
