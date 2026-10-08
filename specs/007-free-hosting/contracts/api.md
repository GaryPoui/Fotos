# Contracts
Se preservan /api/login, /session, /logout, /library, /media, /notes, /settings y /files/:id.

- Sin sesión: archivos y datos responden 401.
- Archivos remotos: Range se pasa al proveedor; Content-Range y estados 200/206/416 se conservan. Nunca se redirige a un objeto público.
- Configuración parcial de DATABASE_URL/SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY falla al iniciar. Se valida bucket privado antes de escuchar.
- Storage REST: API key sólo backend, bucket privado, timeout, errores sanitizados.
- Cuota incluye miniaturas en remoto; 413 al exceder. Las subidas se serializan dentro de la única instancia.
- Fallo remoto: 500/502, sin afirmar que el contenido fue guardado ni exponer claves.
