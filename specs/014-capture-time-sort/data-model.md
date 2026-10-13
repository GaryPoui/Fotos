# Data model
Media añade `capturedAt?: string`, reloj de cámara `YYYY-MM-DDTHH:mm:ss`, sólo fotos. `date` sigue siendo día manual. Para ordenar sólo se usa capturedAt.slice(11), nunca su día o zona.
Meta nuevo `photo-clock:<id>` → JSON `{capturedAt}`; sólo idUUIDv4 de la nueva foto y fecha estricta válida. Registros viejos `capture:` se ignoran; no actualización o backfill.
UploadItem añade `metadataRead?: boolean`, `capturedAt?: string | null`; sobrevive IndexedDB y reemplazo por JPEG convertido. `metadataRead=true` + null evita relectura de archivo convertido. Archivos originales y límites no cambian.
Crear reloj antes de INSERT media; si media falla, limpiar sólo reloj nuevo y objetos nuevos después de verificar que no hubo commit ambiguo. Si está confirmado, conservar reloj. DELETE del recuerdo quita sólo su reloj nuevo después del borrado del registro; editar título/fecha no cambia hora. Idempotencia conserva dato existente.
