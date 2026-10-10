# Validation
1. npm run build; npm test; node node_modules/@playwright/test/cli.js test.
2. Subir JPEG sintético con EXIF de dos días distintos; comprobar día y minuto sin input de fecha. Subir PNG sin EXIF: fecha de subida indicada.
3. Pausar/reanudar una conversión: metadatos conservados en el ítem antes de cambiar File.
4. Combinar Año/Mes/Día/Hora/Minuto y álbum; mosaico, línea y carrusel deben coincidir. Limpiar filtros y probar 360 px/escritorio.
5. Ejecutar dos veces ampliación SQLite y SQL PostgreSQL en bases de prueba con contenido anterior, verificar valores idénticos y ninguna escritura de archivos.
6. Tras respaldo privado completo y CI verde, ampliar schema remoto aditivamente, verificar snapshot, desplegar Render y comparar todos los datos previos y hashes de originales.
