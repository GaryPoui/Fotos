# Data Model
Backup: SQLite consistente y carpeta media; RuntimeConfig: puerto, volumen, contraseña, origen.
## Invariants
UUID de servidor. Nombres físicos nunca del cliente. Fechas válidas ISO.
Títulos <=150; álbum <=80; tags <=10 x 30; body <=30000.
Sesión 7 días, revocada al salir o cambiar contraseña.
Borrado elimina registro/archivo; errores explícitos.
