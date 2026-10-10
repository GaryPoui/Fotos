# Verification — 2026-10-09

## Current correction: restore manual dates
- User requested removal of automatic dates because they were not working. Runtime upload, editing, gallery and viewer restored to 738926d behavior; previous responsive, carousel and music changes retained.
- Fresh private backup in backups/pre-manual-date-restore-2026-10-09/: 151 originals, 183685076 bytes, 2 notes; verified SHA-256, stable library snapshot and read-only raw PostgreSQL snapshot. Includes the new photo added since the previous backup.
- npm run build: PASS. npm test: 33 passed, 5 Firebase emulator tests skipped. New integration regression confirms startup does not change an automatic upload, manual date edits work, original bytes are preserved and optional capture records remain intact.
- No database migration, content deletion, bulk date replacement or credential changes.
- Complete local mobile/desktop Playwright suite: 30/30 PASS, including manual date upload, same-day memories, private uploads, pause/resume, carousel, background music and responsive albums/modals.
- Publication and post-deploy preservation checks pending.

The following evidence describes the previous automatic-date release and is retained for history.

## Recovery and preservation
- Antes de tocar el código, main 738926d estaba sincronizado con origin/main. Tag anotado backup/pre-photo-metadata-2026-10-09 creado y subido.
- Respaldo privado completo fuera de Git: 150 originales (145 fotos y 5 canciones), 183599049 bytes, 2 escritos, títulos, álbumes, ajustes y metadatos históricos. Cada original se releyó de la copia y su SHA-256 coincide.
- Snapshot de base y definición de columnas en backups/pre-photo-metadata-2026-10-09/database.json, sin publicarlo ni exponer credenciales.
- No hay ALTER, UPDATE histórico, cambio de permisos, credenciales ni reescritura de archivos. Nuevas fechas se guardan en meta existente bajo capture:<id>.

## Local checks
- npm test: 38 passed, 5 Firebase emulator tests skipped por requerir ejecución específica; la publicación usa Render/PostgreSQL.
- npm run build y ambos chequeos TypeScript: PASS.
- Suite completa móvil/escritorio: 32/32 PASS. Tras adaptación de persistencia, reanudación y filtros: 4/4 PASS.
- Lectura real EXIF JPEG, calendario/bisiestos y offsets; fallback ausente/dañado; hora histórica desconocida; cámara y subida argentina independientes.
- Reintento con EXIF eliminado del archivo convertido conserva metadatos desde IndexedDB y no duplica recuerdos.
- PostgreSQL PGlite verifica persistencia con rol DML sin permisos de DDL y filas históricas idénticas. SQLite verifica reapertura y datos anteriores idénticos.
- Capturas de datos sintéticos en test-results/metadata-filters-{mobile,desktop}.png.

## Publication
- CI del código final b9e8af9: [38012025644](https://github.com/GaryPoui/Fotos/actions/runs/38012025644), SUCCESS. Incluye 38 pruebas, build, 32 recorridos Chromium/Linux, Docker y persistencia al reemplazar contenedor.
- Render: dep-db4p27flk1mc73fguo4g, commit b9e8af9, Deploy succeeded / Live, 2026-10-09 22:14 ART. Frontend index-DcUGsYRF.js servido por HTTPS.
- Prueba pública a 360, 390 y 1440 px con fixtures sintéticos: cinco filtros combinados, visor con minuto y procedencia, sin desbordes ni errores de página. Sin escribir ni borrar recuerdos personales para esta prueba. Captura test-results/render-metadata-390.png.
- Comparación PostgreSQL posterior: estructura de columnas y cada campo de las filas históricas media/notes/meta intactos.
- Comparación de los 150 originales remotos posterior al deploy: tamaños y SHA-256 idénticos al respaldo; 145 fotos y 5 canciones. Los 2 escritos, sus títulos y cuerpos, los álbumes, etiquetas, favoritos, fechas históricas y ajustes permanecen idénticos.
- Respaldo y verificaciones completos en backups/pre-photo-metadata-2026-10-09/, excluidos de Git. No se cambió ninguna credencial o permiso ni se ejecutó migración remota.
