# Contract
`npm run backfill:photo-clock -- --mode scan|apply --snapshot <dir privado bajo backups> --env .env.render`. Origen fijo del sitio propio; no URL arbitraria con credenciales. Scan requiere snapshot database.json y genera proposal.json, originales/digests privados; sólo aplicación explícita escribe meta. Apply comprueba digest/hora/archivo local, valida ids y raw filas, transacción insert-only. Repetición no reemplaza claves.
La API existente muestra capturedAt opcional y orden por día manual/hora. No nuevos contratos públicos o formulario de hora.
