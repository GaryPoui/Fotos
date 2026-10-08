# Data Model
Media: id, kind, filename privado, mime, size, título, fecha, álbum, tags, favorite, createdAt.
## Invariants
UUID de servidor. Nombres físicos nunca del cliente. Fechas válidas ISO.
Títulos <=150; álbum <=80; tags <=10 x 30; body <=30000.
Sesión 7 días, revocada al salir o cambiar contraseña.
Borrado elimina registro/archivo; errores explícitos.
