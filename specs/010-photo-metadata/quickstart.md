# Validation
1. npm run build; npm test; node node_modules/@playwright/test/cli.js test.
2. Subir JPEG sintético con EXIF de dos días distintos; comprobar día y minuto sin input de fecha. Subir PNG sin EXIF: fecha de subida indicada.
3. Pausar/reanudar una conversión: metadatos conservados en el ítem antes de cambiar File.
4. Combinar Año/Mes/Día/Hora/Minuto y álbum; mosaico, línea y carrusel deben coincidir. Limpiar filtros y probar 360 px/escritorio.
5. Guardar/reabrir la cronología en meta de SQLite/PostgreSQL usando sólo permisos DML; verificar filas anteriores idénticas y ninguna modificación de schema ni archivos.
6. Tras respaldo privado completo y CI verde, desplegar Render y comparar todos los datos previos y hashes de originales. No hay SQL de migración ni privilegios adicionales.
