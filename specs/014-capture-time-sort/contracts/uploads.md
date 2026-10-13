# Contracts
- POST `/api/media` conserva fecha manual, añade campo interno opcional `capturedAt`: timestamp local estricto o vacío. Sólo fotos; el EXIF original del archivo prevalece sobre candidato. Candidato para original convertido sin EXIF, nunca exigido ni editable en la UI. No GPS ni fecha de modificación.
- Respuesta de foto y GET `/api/library`/`/api/media`: `capturedAt` opcional; ausencia equivale a hora desconocida. No nuevos campos obligatorios. Listado usa comparator compartido por fecha manual/hora/desempates. Audio/video no adquieren hora de toma.
- PATCH `/api/media/:id`: editar `date` no cambia `capturedAt`; no se expone edición de hora. DELETE elimina sólo registro/reloj nuevo de ese id; históricos ajenos intactos.
- Fotos sin EXIF o candidato válido se guardan con el mismo comportamiento de fecha, formatos, límite y cuota. Las subidas repetidas con X-Upload-Id conservan la primera confirmación.
- Borrador IndexedDB añade metadataRead y capturedAt sin subir datos a terceros. Logout/descartar elimina borrador como antes.
