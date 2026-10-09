# Publicar nuestro rincón

La modalidad vigente elegida es Render Free + Supabase Free. Se conserva la guía de [Firebase anterior](firebase-hosting.md) como referencia.

Esta aplicación necesita **un servidor Node y persistencia local o remota**. Para presupuesto cero,
seguir [Render Free + Supabase Free](free-hosting.md). GitHub Pages y un hosting
estático no guardan recuerdos ni ejecutan esta API. El repo incluye Docker; no depende de Sites.

## Antes de publicar

- Elegir APP_PASSWORD de 10 a 256 caracteres y guardarla únicamente como secreto del proveedor.
- Definir APP_ORIGIN como URL HTTPS exacta, sin barra final.
- Node >=22.13, una instancia, volumen DATA_DIR y al menos 512 MiB de RAM.
- MAX_STORAGE_MB limita los originales (1 GiB por defecto); reservar espacio adicional para miniaturas,
  SQLite y temporales. MAX_FILE_MB: 200 por defecto. El proxy también debe aceptar ese tamaño.
- No usar un disco efímero. No activar múltiples réplicas compartiendo esta SQLite.

## Opción 1: servidor con Docker

1. Configurar .env con APP_PASSWORD y APP_ORIGIN; TRUST_PROXY=1 si hay un proxy delante.
2. Ejecutar `docker compose up -d --build`.
3. Configurar un proxy HTTPS (Caddy/nginx) hacia 127.0.0.1:3001 y su dominio.
4. Verificar /api/health y que /api/library devuelva 401 sin sesión.
5. Entrar, subir un recuerdo, reiniciar el contenedor y confirmar que siga guardado.

El volumen rincon-data conserva los datos entre despliegues. Nunca ejecutar down -v salvo que
se quiera borrar todo. El contenedor corre como usuario node; el disco debe permitirle escribir.

## Opción 2: Render u otro hosting Node con volumen

1. Crear Web Service desde este repo y seleccionar Docker.
2. Elegir un servicio que permita disco persistente y montarlo en /var/data.
3. Variables: NODE_ENV=production, DATA_DIR=/var/data, TRUST_PROXY=1,
   APP_ORIGIN=https://tu-servicio.onrender.com, APP_PASSWORD=contraseña propia.
4. Health check: /api/health. Una sola instancia. No inicializar datos en build/predeploy.
5. El disco persistente de Render requiere plan pago: no se contrató ni publicó un servicio
   automáticamente. Consultar [discos](https://render.com/docs/disks) y [Docker](https://render.com/docs/docker).

También funciona sin Docker: npm ci, npm run build, npm prune --omit=dev, npm start.
Es necesario conservar DATA_DIR al actualizar código.

## Respaldo consistente

1. Detener el servidor y esperar a que termine. Tras un cierre forzado, esperar 10 segundos.
   El servidor y el respaldo comparten un bloqueo con heartbeat en .server.lock, válido entre contenedores.
2. En local: `npm run backup`. Opcional BACKUP_DIR apunta a otro disco/directorio fuera de DATA_DIR.
3. En Docker, con el servicio detenido:
   `docker compose run --rm --no-deps -e BACKUP_DIR=/var/backups -v ./backups:/var/backups rincon node dist-server/scripts/backup.js`
   Dar permiso de escritura a usuario node sobre el directorio de respaldo.
4. Conservar sólo carpetas que contengan COMPLETE. El respaldo incluye SQLite y todos los medios
   referenciados/miniaturas, sin sesiones ni contraseña. Tratarlo como información privada.
5. Copiar el respaldo a otra ubicación segura. Reiniciar servidor.

La consistencia requiere detener escrituras; no ejecutar el script contra una instancia que use
la base sin el mecanismo .server.lock del entrypoint oficial. No borrar manualmente un bloqueo activo.

## Restaurar

1. Detener el servidor. Guardar una copia del DATA_DIR actual antes de reemplazarlo.
2. Verificar COMPLETE y manifest.json del respaldo.
3. Copiar rincon.sqlite y media/ a un DATA_DIR nuevo vacío; crear tmp/ si no existe.
4. Usar la misma APP_PASSWORD o elegir otra; se pedirá iniciar sesión nuevamente.
5. Arrancar con DATA_DIR apuntando a la carpeta restaurada. Revisar recuerdos, música y escritos.
6. En Docker, copiar dentro del volumen o montar la carpeta nueva en /var/data, con propietario node.

No mezclar una SQLite restaurada con archivos de otra versión ni copiar archivos -wal/-shm antiguos.

## Límites de esta versión

Una contraseña compartida, no cuentas separadas. Sin recuperación por email: cambiar el secreto del
hosting revoca sesiones. Sin transcodificación: soporte de video/audio depende del navegador.
HEIC/HEVC no están soportados; exportar como JPEG/MP4 H.264 o WebM compatible.
Los archivos se validan por firma y las fotos se decodifican para miniaturas; esto no es un antivirus.
node:sqlite es experimental en Node 22. Los originales permanecen privados tras sesión.

