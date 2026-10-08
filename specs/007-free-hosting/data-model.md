# Data model
Se conservan meta, sessions, media y notes de specs anteriores. PostgreSQL conserva createdAt entre comillas para mantener contrato JSON y expires como bigint. Todos los campos personales siguen privados bajo RLS sin políticas públicas.

En remoto, media.size conserva tamaño original y media.storedBytes suma original y miniatura. Los cupos usan storedBytes; local sigue usando size. Regla: archivo <= 50.000.000 bytes; suma storedBytes <= 900.000.000 bytes.

Los objetos se nombran con UUID y extensión validada; miniatura UUID.thumb.webp. El bucket no es público. Subida: validar -> generar miniatura -> cupo -> subir objetos -> insertar metadatos -> limpiar temporales. Si falla se intentan borrar objetos; si la limpieza remota falla se registra para revisión de huérfanos. Borrado: borrar objetos antes de metadatos.
