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

## Publicación y conservación final — 2026-10-14
- Commit `3aaec30`, subido a main. GitHub Actions `38521291233`: SUCCESS en pruebas, build, navegador, Docker y persistencia tras recrear contenedor.
- Render `dep-db7hvec9v7es73c51sng`: Deploy succeeded / Live, fuente `3aaec30`, publicado el2026-10-14 a las03:22 ART. Frontend público `/assets/index-BqK3VFQ6.js` coincide con build verificado.
- UI pública: tres JPEG sintéticos con DateTimeOriginal12:30:03/01/02 y offset+09:00 se subieron mediante el formulario, sin escribir hora; el día manual2012-02-14 quedó intacto y la hora de cámara2025-04-03 se extrajo automáticamente hasta el segundo. Cada descarga original tiene SHA-256 idéntico al JPEG generado.
- QA360/390/1440: mosaico/línea de tiempo/carrusel comparten orden, asc/desc funciona, visor muestra HH:mm:ss y el día manual; no hay desbordes. Las imágenes y miniaturas se decodificaron correctamente antes de capturar evidencia.
- Sólo se retiraron las fotos demo generadas con prefijo/álbum aleatorio y guardas de identidad/título/tamaño/día. Library anterior conservó archivos, notas, álbumes, lugares y ajustes; usados245222910, disponibles654777090, reservas0. La comparación SQL final confirma schema y cada fila histórica intactos:209 archivos,3 escritos,1 lugar, títulos/fechas/metadatos previos.
- Capturas locales: `test-results/render-photo-clock-{360,390,1440}.png` y `test-results/render-photo-clock-viewer-{360,390,1440}.png`. Copia duradera de evidencia móvil en `backups/pre-capture-time-2026-10-14/proof-camera-clock-mobile.png`. Las capturas muestran exclusivamente fotos demo y ocultan contenido personal mediante filtrado de la respuesta de la biblioteca en el navegador de prueba; no se modificó ese contenido en servidor.
- No compresión de originales, backfill, migración, concesión de permisos, cambio de contraseña ni nueva facturación. La recomendación de optimización/R2 se mantiene como asesoría separada.
