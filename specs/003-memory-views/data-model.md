# Data Model
ViewPreference: vista elegida local; SlideshowState: índice y pausa, efímero.
## Invariants
UUID de servidor. Nombres físicos nunca del cliente. Fechas válidas ISO.
Títulos <=150; álbum <=80; tags <=10 x 30; body <=30000.
Sesión 7 días, revocada al salir o cambiar contraseña.
Borrado elimina registro/archivo; errores explícitos.
