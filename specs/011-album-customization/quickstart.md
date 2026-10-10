# Validation
1. npm test; npm run build; node node_modules/@playwright/test/cli.js test.
2. Con datos sintéticos locales, editar nombre y portada de grupo con dos fotos; recargar, filtrar por nombre, abrir visor, subir otra foto al grupo usando título visible.
3. Cancelar, simular error de red y reintentar; probar inválidos/colisiones/foto ajena y comprobar que registros originales no cambian.
4. Mover/eliminar foto portada: fallback; grupo sólo videos: editor sin selector de fotos.
5. Probar360/390/1440, teclado y modal sin desbordar. Copia ZIP contiene albums.
6. Tras CI verde, publicar Render; UI pública con fixtures sin escribir contenido personal; comparar respaldo/DB/hashes.
