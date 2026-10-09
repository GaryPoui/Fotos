# Research
## Decisions
Node SQLite, prepared statements y WAL: carga pequeña y una instancia.
Archivos fuera de public entregados por ID bajo sesión; token aleatorio hasheado en SQLite.
Contraseña del entorno, cookies HttpOnly/SameSite/Secure, rate limit antes del hash.
Multer a temporal, file-type y allowlist; limpiar al fallar.
CSS mobile first celeste/rosado, texto oscuro, sin fuentes remotas.
## Alternatives
PostgreSQL/S3 requieren cuentas; browser-only no sirve entre dispositivos.
## Primary sources
[SQLite](https://nodejs.org/download/release/v22.13.0/docs/api/sqlite.html)
[Crypto](https://nodejs.org/docs/latest-v22.x/api/crypto.html)
[Multer](https://expressjs.com/en/resources/middleware/multer/)
[Render disks](https://render.com/docs/disks)
## Limitations
Firma no garantiza decodificación. Sin antivirus/transcodificación. node:sqlite experimental en Node 22.
Disco de Render requiere plan pago; Docker permite otros proveedores.

## Música de fondo
La política de autoplay puede rechazar HTMLMediaElement.play con NotAllowedError: ofrecer activación explícita. Safari iOS puede ignorar volume, por lo que se detecta la asignación y se usa Web Audio GainNode para atenuar antes de reproducir. No iniciar una canción nueva por refrescar la biblioteca.
Fuentes: https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay y https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/volume.

