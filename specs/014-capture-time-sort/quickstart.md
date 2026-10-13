# Verification guide
1. `npm test`: parser JPEG/PNG/WebP real con EXIF sintético, validación de segundos/calendario, offset sin conversión, horas desconocidas y orden total estable; SQLite/PGlite, reintentos y commit ambiguo.
2. `npm run build`; `npm run test:e2e`: subir tres fotos con mismo día manual en orden contrario a hora/segundo, comprobar todas las vistas y asc/desc, visor HH:mm:ss y ausencia de campo manual para hora. Conservar fecha de upload/edición.
3. HEIC o JPEG preparado sin EXIF: conservar dato anterior a conversión en borrador y reintento. Metadatos ausentes/dañados no bloquean upload ni inventan hora.
4. Snapshot privado antes y comparación final de cada fila/schema histórico. Prueba pública sólo con UUIDs sintéticos nuevos y limpieza exacta propia; nunca tocar originales personales.
5. Commit/push, GitHub checks, Render Live/source y QA360/390/1440; registrar evidencia y recomendación de espacio con fuentes, sin modificaciones de almacenamiento/costo.
