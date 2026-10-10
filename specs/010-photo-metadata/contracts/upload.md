# Contracts
POST /api/media mantiene compatibilidad con campos anteriores. Nueva UI envía autoDate=true para recuerdos y capturedAt/captureOffset opcionales extraídos del original; formato estricto, fechas inválidas se rechazan antes de almacenar objetos.
Servidor conserva createdAt real. En modo automático el día se deriva de capturedAt válido o subida argentina; audio no cambia. Respuesta/library añade capturedAt, captureOffset, dateSource opcionales/nullables.
PATCH /api/media mantiene campos editables previos y no modifica campos de metadatos. Editar título/favorito preserva fecha y hora original.
Originales y endpoints privados no cambian. No hay borrado, reemplazo ni reclasificación histórica.
Fallback Firebase heredado mantiene compatibilidad de sus contratos existentes, sin desplegar ni ampliar permisos en esa infraestructura que ya no se usa.
