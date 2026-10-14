# Verification — Orden por hora de toma
## Verificación previa
- 2026-10-13: aclaración directa del usuario registrada; día manual y hora automática.
- Snapshot privado inicial en backups/pre-capture-time-2026-10-13/; punto de recuperación remoto backup/pre-capture-time-2026-10-13. Al retomar el 2026-10-14, snapshot fresco en backups/pre-capture-time-2026-10-14/ confirma 209 archivos, 3 escritos y 1 lugar; usados245222910 bytes, disponibles654777090. Ningún contenido privado en Git.
- `npm test`: 55 PASS, 5 pruebas de reglas Firebase requieren emulador y continúan omitidas; el sitio activo usa PostgreSQL/Storage privado de Supabase.
- `npm run build`: PASS en ambos chequeos TypeScript, frontend y servidor. Advertencias existentes de chunks opcionales HEIC/Firebase. exifr7.1.3 fijado; lockfile cambia sólo ese paquete.
- Playwright: 42/42 PASS en móvil y escritorio; recorrido nuevo también verifica 360px, horas/segundos en orden opuesto de subida, asc/desc y las tres vistas, visor HH:mm:ss, día manual y reintento de borrador convertido sin EXIF conservando su lectura previa.
- Integración: JPEG real con DateTimeOriginal, offset de cámara sin desplazamiento, prioridad sobre candidato contrario, bytes originales idénticos, edición manual de fecha sin alterar hora, rechazo de edición de hora, ausencia de EXIF/segundos inválidos, metadatos antiguos capture: ignorados.
- Parser: JPEG, TIFF contenido en PNG/WebP, calendario/bisiesto, segundos completos, ausencia de EXIF y datos dañados. Parse selectivo sin GPS.
- PGlite: hora opcional persistente sin DDL, reinicio y reintento idempotente, fallback de JPEG convertido, todas las filas anteriores intactas, original y hora confirmados conservados cuando se pierde la respuesta de INSERT; borrado sólo del reloj del id nuevo.
- Fecha manual y límites200MB video/50M foto/audio conservados; ningún original comprimido/reemplazado ni cuenta activada. Recomendación de espacio con fuentes en storage-options.md.

Pendiente: CI, publicación y prueba pública con fotos sintéticas propias, comparación SQL final y capturas.
